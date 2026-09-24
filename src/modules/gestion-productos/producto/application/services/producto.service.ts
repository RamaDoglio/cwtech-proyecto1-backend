import {
  forwardRef,
  Inject,
  Injectable,
  ConflictException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ProveedorService } from 'src/modules/organizacion/proveedor/application/services/proveedor.service';
import { PaginacionUtils } from 'src/modules/common/utils/pagination/paginacion-utils';
import { UsuarioService } from 'src/modules/gestion-usuario/usuario/application/services/usuario.service';
import { Usuario } from 'src/modules/gestion-usuario/usuario/domain/entities/usuario.entity';
import { ensureNotSistemaEntity } from 'src/modules/common/utils/atrituto-sistema';
import { AuditoriaMapper } from 'src/modules/gestion-sistema/auditoria/mappers/auditoria.mapper';
import { MessageFrontUtils } from 'src/modules/common/utils/message/message-front.util';
import { Producto } from '../../domain/entities/producto.entity';
import { IProductoRepository } from '../../domain/interfaces/producto.repository-interface';
import { CreateProductoDto } from '../../dto/create-producto.dto';
import { GetProductoDto } from '../../dto/get-producto.dto';
import { UpdateProductoDto } from '../../dto/update-producto.dto';
import { AjustarStockManualDto } from '../../dto/ajustar-stock-manual.dto';
import { ProductoMapper } from '../../mappers/producto.mapper';
import { LineaService } from 'src/modules/gestion-productos/linea/application/services/linea.service';
import { MarcaService } from 'src/modules/gestion-productos/marca/application/services/marca.service';
import { ProductoIntrinsicValidationService } from '../../domain/services/producto-intrinsic-validation.service';
import { ProductoValidationService } from '../../domain/services/producto-validation.service';
import { ProductoRelatedEntitiesValidator } from '../../infraestructure/validators/producto-related-entities.validator';
import { ProductoUniquenessValidator } from '../../infraestructure/validators/producto-uniqueness.validator';
import { UsuarioValidator } from 'src/modules/common/utils/validation/usuario-validator';
import { ProductoDeletePolicy } from '../policies/producto-delete.policy';
import { TipoMovimientoStock } from '../../domain/entities/movimiento-stock.entity';
import { CambioPreciosMasivoDto } from '../../dto/cambio-precios-masivo.dto';
import { PoliticaPrecio } from '../../domain/services/politica-precio.service';
import { CambioPreciosMasivoHistorial } from '../../domain/entities/cambio-precio-masivo-historial.entity';
import { AlcanceAjustePrecio } from '../../enums/alcance-ajuste-precio.enum';
import { MovimientoStock } from '../../domain/entities/movimiento-stock.entity';
import { HistorialPrecio } from '../../domain/entities/historial-precio.entity';
import { CambiarPrecioDto } from '../../dto/cambiar-precio.dto';
import { HistorialPrecioDto } from '../../dto/historial-precio.dto';
import { Presentacion } from '../../domain/value-objects/presentacion.vo';
import { PresentacionRequeridaException } from 'src/modules/common/exceptions/presentacion-requerida.exception';
import { TipoAumento } from 'src/modules/common/enums/tipo-aumento.emun';
import { Linea } from '../../../linea/domain/entities/linea.entity';
import { DataSource, EntityManager } from 'typeorm';

@Injectable()
export class ProductoService {
  private readonly logger = new Logger(ProductoService.name);
  private readonly ENTITY_NAME = 'Producto';
  private readonly MOTIVO_EDICION =
    'Edición del producto: precio recalculado según costo y margen';

  constructor(
    @Inject('IProductoRepository')
    private readonly repository: IProductoRepository,
    private readonly lineaService: LineaService,
    private readonly dataSource: DataSource,

    @Inject(forwardRef(() => MarcaService))
    private readonly marcaService: MarcaService,
    private readonly proveedorService: ProveedorService,
    private readonly usuarioService: UsuarioService,

    // Domain Services
    private readonly intrinsicValidationService: ProductoIntrinsicValidationService,
    private readonly validationService: ProductoValidationService,

    // Infrastructure Validators
    private readonly relatedEntitiesValidator: ProductoRelatedEntitiesValidator,
    private readonly uniquenessValidator: ProductoUniquenessValidator,
    private readonly usuarioValidator: UsuarioValidator,

    private readonly productoDeletePolicy: ProductoDeletePolicy,
  ) {}

  // ============================================================
  // CREATE
  // ============================================================
  async create(dto: CreateProductoDto) {
    this.logger.log(
      `Creando un nuevo ${this.ENTITY_NAME} con denominación: ${dto.denominacion}`,
    );

    const { marca, linea, usuario, presentacion, envase } =
      await this.validarYPrepararCreacion(dto);

    const producto = ProductoMapper.toEntityFromCreateDto(
      dto,
      linea,
      marca,
      usuario,
    );
    producto.asignarPresentacion(presentacion, envase);

    const entity = await this.repository.save(producto);

    return MessageFrontUtils.createSimple(
      this.ENTITY_NAME,
      entity.denominacion,
      'creada',
    );
  }

  // ============================================================
  // UPDATE
  // ============================================================
  async update(id: number, dto: UpdateProductoDto) {
    this.logger.log(`Actualizando ${this.ENTITY_NAME} con ID: ${id}`);

    const { marca, linea, usuario, productoActual } =
      await this.validarYPrepararActualizacion(id, dto);

    const precioAnterior = productoActual.precio ?? 0;
    ProductoMapper.applyUpdate(productoActual, dto, linea, marca, usuario);
    const precioNuevo = productoActual.precio ?? 0;

    // El mapper recalcula el precio con costo y margen en cada edición; solo
    // un cambio real queda en el historial. HistorialPrecio.crear() rechaza
    // un precio nuevo <= 0 antes de persistir nada.
    const entity =
      precioNuevo === precioAnterior
        ? await this.repository.save(productoActual)
        : await this.guardarConHistorialDePrecio(
            productoActual,
            HistorialPrecio.crear(
              productoActual.id,
              precioAnterior,
              precioNuevo,
              this.MOTIVO_EDICION,
              usuario.id,
            ),
          );

    return MessageFrontUtils.createSimple(
      this.ENTITY_NAME,
      entity.denominacion,
      'editada',
    );
  }

  // ============================================================
  // REMOVE
  // ============================================================
  async remove(id: number, usuarioId: number) {
    const entity = await this.findEntityById(id);

    ensureNotSistemaEntity(entity, 'Producto');

    const usuario = await this.usuarioService.findOne(usuarioId);
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${usuarioId} no encontrado.`);
    }

    await this.repository.remove(entity, usuario);

    return MessageFrontUtils.createSimple(
      this.ENTITY_NAME,
      entity.denominacion,
      'eliminada',
    );
  }

  // ============================================================
  // STOCK
  // ============================================================
  async incrementarStock(
    productoId: number,
    cantidad: number,
    origen?: string,
    usuarioId?: number,
  ): Promise<number> {
    const resultado = await this.ajustarStockEnTransaccion(
      productoId,
      cantidad,
      TipoMovimientoStock.INGRESO,
      origen,
      usuarioId,
    );
    return resultado.stock;
  }

  async decrementarStock(
    productoId: number,
    cantidad: number,
    origen?: string,
    usuarioId?: number,
  ): Promise<number> {
    const resultado = await this.ajustarStockEnTransaccion(
      productoId,
      -cantidad,
      TipoMovimientoStock.EGRESO,
      origen,
      usuarioId,
    );
    return resultado.stock;
  }

  async ajustarStockManual(
    productoId: number,
    dto: AjustarStockManualDto,
  ): Promise<{ message: string; stockActual: number }> {
    await this.usuarioValidator.validarUsuarioExiste(dto.usuarioId);

    const resultado = await this.ajustarStockEnTransaccion(
      productoId,
      dto.cantidad,
      TipoMovimientoStock.AJUSTE_MANUAL,
      dto.motivo,
      dto.usuarioId,
    );

    return {
      message: `Stock ajustado para "${resultado.denominacion}"`,
      stockActual: resultado.stock,
    };
  }

  // ============================================================
  // CONSULTAS
  // ============================================================
  async findByRapido(
    codigo: string,
    exacto: boolean,
    skip: number,
    take: number,
  ): Promise<{ data: GetProductoDto[]; total: number }> {
    const result = await this.repository.findByRapido(
      codigo,
      exacto,
      skip,
      take,
    );
    return {
      data: result.data.map(ProductoMapper.toBusquedaDto),
      total: PaginacionUtils.totalItems(result.total),
    };
  }

  async findBy(
    denominacion: string,
    linea: string,
    superlinea: string,
    codigoProveedor: string,
    codProveedorExacto: boolean,
    codigoReferencia: string,
    marca_id: number,
    linea_id: number,
    proveedor_id: number,
    conStock: boolean,
    skip: number,
    take: number,
  ): Promise<{ data: GetProductoDto[]; total: number }> {
    const result = await this.repository.findBy(
      denominacion,
      linea,
      superlinea,
      codigoProveedor,
      codProveedorExacto,
      codigoReferencia,
      marca_id,
      linea_id,
      proveedor_id,
      conStock,
      skip,
      take,
    );
    return {
      data: result.data.map(ProductoMapper.toBusquedaDto),
      total: PaginacionUtils.totalItems(result.total),
    };
  }

  async buscarMarcaDesdeProducto(id: number) {
    return this.marcaService.findEntityById(id);
  }

  async buscarLineaDesdeProducto(id: number) {
    return this.lineaService.findEntityById(id);
  }

  async findByIdConAuditoria(id: number) {
    const entity = await this.repository.findByIdConAuditoria(id);
    if (!entity) {
      throw new NotFoundException(
        `${this.ENTITY_NAME} con ID ${id} no encontrado.`,
      );
    }
    return AuditoriaMapper.mapProductoToDto(entity);
  }

  async findDtoById(id: number) {
    const entity = await this.repository.findOne(id);
    if (!entity) {
      throw new NotFoundException(
        `${this.ENTITY_NAME} con ID ${id} no encontrado.`,
      );
    }
    return ProductoMapper.toDto(entity);
  }

  async findEntityById(id: number) {
    const entity = await this.repository.findOne(id);
    if (!entity) {
      throw new NotFoundException(
        `${this.ENTITY_NAME} con ID ${id} no encontrado.`,
      );
    }
    return entity;
  }

  async findAllForLineas(denominacion: string) {
    return this.lineaService.findAllFor(denominacion);
  }

  async findAllForMarcas(denominacion: string) {
    return this.marcaService.findAllFor(denominacion);
  }

  async findByDenominacionCodigoProveedorFiltered(
    denominacion: string,
    skip = 0,
    take = 10,
  ): Promise<{ data: GetProductoDto[]; total: number }> {
    const result =
      await this.repository.findByDenominacionCodigoProveedorFiltered(
        denominacion,
        skip,
        take,
      );
    return {
      data: result.data.map(ProductoMapper.toBusquedaDto),
      total: PaginacionUtils.totalItems(result.total),
    };
  }

  async existsProductosActivosByMarca(marcaId: number): Promise<boolean> {
    return this.repository.existsProductosActivosByMarca(marcaId);
  }

  async existsProductosActivosByLinea(lineaId: number): Promise<boolean> {
    return this.repository.existsProductosActivosByLinea(lineaId);
  }

  async findByIds(ids: number[]): Promise<Producto[]> {
    return this.repository.findByIds(ids);
  }

  async previewCambioMasivo(dto: CambioPreciosMasivoDto) {
    await this.usuarioValidator.validarUsuarioExiste(dto.usuarioId);

    const productos = await this.repository.findActivosParaAjustePrecio(
      dto.alcance === AlcanceAjustePrecio.LINEA ? dto.lineaId : undefined,
    );

    if (productos.length === 0) {
      throw new NotFoundException(
        dto.alcance === AlcanceAjustePrecio.LINEA
          ? `No hay productos activos para la línea ${dto.lineaId}.`
          : 'No hay productos activos para aplicar el cambio masivo.',
      );
    }

    const items = productos.map((producto) => {
      const precioActual = Number(producto.precio ?? 0);

      try {
        const precioNuevo = PoliticaPrecio.aplicarAjuste(
          precioActual,
          dto.tipo,
          dto.valor,
        );

        return {
          productoId: producto.id,
          denominacion: producto.denominacion,
          precioActual,
          precioNuevo,
          valido: true,
        };
      } catch {
        return {
          productoId: producto.id,
          denominacion: producto.denominacion,
          precioActual,
          precioNuevo: null,
          valido: false,
        };
      }
    });

    return {
      items,
      cantidadTotal: items.length,
      cantidadInvalidos: items.filter((item) => !item.valido).length,
    };
  }

  async aplicarCambioMasivo(
    dto: CambioPreciosMasivoDto,
  ): Promise<{ message: string; cantidadProductosAfectados: number }> {
    const usuario = await this.usuarioValidator.validarUsuarioExiste(
      dto.usuarioId,
    );
    const lineaId =
      dto.alcance === AlcanceAjustePrecio.LINEA ? dto.lineaId : undefined;

    // Todo o nada: si falla un producto, el ajuste no se aplica a ninguno.
    return this.dataSource.transaction(async (manager) => {
      const productos = await this.findActivosParaAjustePrecioConLock(
        manager,
        lineaId,
      );

      if (productos.length === 0) {
        throw new NotFoundException(
          dto.alcance === AlcanceAjustePrecio.LINEA
            ? `No hay productos activos para la línea ${dto.lineaId}.`
            : 'No hay productos activos para aplicar el cambio masivo.',
        );
      }

      const motivo = await this.motivoAjusteMasivo(manager, dto, lineaId);

      for (const producto of productos) {
        const precioActual = Number(producto.precio ?? 0);
        const nuevoPrecio = PoliticaPrecio.aplicarAjuste(
          precioActual,
          dto.tipo,
          dto.valor,
        );

        // Solo los cambios reales quedan en el historial del producto.
        if (nuevoPrecio === precioActual) continue;

        const historial = producto.cambiarPrecio(
          nuevoPrecio,
          motivo,
          usuario.id,
        );

        await manager.update(Producto, producto.id, {
          precio: producto.precio,
        });
        await manager.save(HistorialPrecio, historial);
      }

      await manager.save(
        CambioPreciosMasivoHistorial,
        manager.create(CambioPreciosMasivoHistorial, {
          tipo: dto.tipo,
          valor: dto.valor,
          alcance: dto.alcance,
          lineaId: dto.lineaId,
          cantidadProductosAfectados: productos.length,
          usuario,
        }),
      );

      return {
        message: `Se aplicó el ajuste a ${productos.length} productos.`,
        cantidadProductosAfectados: productos.length,
      };
    });
  }

  async cambiarPrecio(
    productoId: number,
    dto: CambiarPrecioDto,
  ): Promise<{
    message: string;
    precioAnterior: number;
    precioActual: number;
  }> {
    await this.usuarioValidator.validarUsuarioExiste(dto.usuarioId);

    const resultado = await this.cambiarPrecioEnTransaccion(
      productoId,
      dto.precioNuevo,
      dto.motivo,
      dto.usuarioId,
    );

    return {
      message: `Precio actualizado para "${resultado.denominacion}"`,
      precioAnterior: resultado.precioAnterior,
      precioActual: resultado.precioActual,
    };
  }

  async findHistorialPrecios(
    productoId: number,
    skip: number,
    take: number,
  ): Promise<{ data: HistorialPrecioDto[]; total: number }> {
    await this.findEntityById(productoId);

    const historialRepository = this.dataSource.getRepository(HistorialPrecio);
    const [rows, total] = await historialRepository.findAndCount({
      where: { productoId },
      order: { fecha: 'DESC' },
      skip,
      take,
    });

    return {
      data: rows.map((row) => ({
        id: row.id,
        productoId: row.productoId,
        precioAnterior: row.precioAnterior,
        precioNuevo: row.precioNuevo,
        motivo: row.motivo,
        fecha: row.fecha,
        usuarioId: row.usuarioId,
      })),
      total: PaginacionUtils.totalItems(total),
    };
  }

  // ============================================================
  // VALIDACIONES PRIVADAS
  // ============================================================
  private async validarYPrepararCreacion(dto: CreateProductoDto) {
    // CR-005: la denominación automática necesita marca, línea y presentación
    // (envase) resueltos ANTES de poder armar el string, así que ese caso se
    // arma en un flujo aparte en vez de intercalarse acá.
    if (dto.generarDenominacionAutomatica === true) {
      return this.validarYPrepararCreacionConDenominacionAutomatica(dto);
    }

    // dto.denominacion es opcional en el tipo por CR-005 (generación
    // automática), pero acá generarDenominacionAutomatica no es true, así que
    // el ValidationPipe ya exigió que venga (ver create-producto.dto.ts).
    this.intrinsicValidationService.validarDatosBasicos({
      denominacion: dto.denominacion!,
      marcaId: dto.marcaId,
      lineaId: dto.lineaId,
      alicuotaIva: dto.alicuotaIva,
    });

    // PA-023 §5: la presentación es obligatoria en el alta. Se valida antes de
    // las validaciones que consultan la base.
    if (dto.presentacion == null) {
      throw new PresentacionRequeridaException();
    }
    const presentacion = Presentacion.crear(dto.presentacion);

    await this.uniquenessValidator.validarDenominacionUnica(dto.denominacion!);

    if (dto.codigoProveedor) {
      await this.uniquenessValidator.validarCodigoProveedorUnico(
        dto.codigoProveedor,
        0,
      );
    }

    const { marca, linea } =
      await this.relatedEntitiesValidator.validarYObtenerEntidadesRelacionadas(
        dto.marcaId,
        dto.lineaId,
      );

    this.validationService.validarEntidadesRelacionadas(marca, linea);

    const envase =
      await this.relatedEntitiesValidator.validarYObtenerEnvasePresentacion(
        presentacion.envaseId,
      );

    const usuario = await this.usuarioValidator.validarUsuarioExiste(
      dto.usuarioCreatedId,
    );

    return { marca, linea, usuario, presentacion, envase };
  }

  // CR-005: mismo contrato que validarYPrepararCreacion, pero resuelve marca,
  // línea y envase primero para poder generar la denominación antes de
  // validarla. dto.denominacion se sobrescribe con el valor generado
  // (cualquier valor recibido en el request se ignora).
  private async validarYPrepararCreacionConDenominacionAutomatica(
    dto: CreateProductoDto,
  ) {
    if (dto.presentacion == null) {
      throw new PresentacionRequeridaException();
    }
    const presentacion = Presentacion.crear(dto.presentacion);

    const { marca, linea } =
      await this.relatedEntitiesValidator.validarYObtenerEntidadesRelacionadas(
        dto.marcaId,
        dto.lineaId,
      );
    this.validationService.validarEntidadesRelacionadas(marca, linea);

    const envase =
      await this.relatedEntitiesValidator.validarYObtenerEnvasePresentacion(
        presentacion.envaseId,
      );

    // El envase va incluido: sin él, la misma Marca+Línea+contenido en dos
    // envases distintos (ej. botella y lata) generaría la misma
    // denominación y la segunda alta chocaría con una colisión que no es
    // un duplicado real.
    dto.denominacion = Producto.generarDenominacionAutomatica(
      marca.denominacion,
      linea.denominacion,
      presentacion.texto(envase.denominacion),
    );

    this.intrinsicValidationService.validarDatosBasicos({
      denominacion: dto.denominacion,
      marcaId: dto.marcaId,
      lineaId: dto.lineaId,
      alicuotaIva: dto.alicuotaIva,
    });

    await this.uniquenessValidator.validarDenominacionUnica(dto.denominacion);

    if (dto.codigoProveedor) {
      await this.uniquenessValidator.validarCodigoProveedorUnico(
        dto.codigoProveedor,
        0,
      );
    }

    const usuario = await this.usuarioValidator.validarUsuarioExiste(
      dto.usuarioCreatedId,
    );

    return { marca, linea, usuario, presentacion, envase };
  }

  private async ajustarStockEnTransaccion(
    productoId: number,
    cantidad: number,
    tipo: TipoMovimientoStock,
    motivo?: string,
    usuarioId?: number,
  ): Promise<{ stock: number; denominacion: string }> {
    return this.dataSource.transaction(async (manager) => {
      // Serializa ajustes del mismo producto y evita actualizaciones perdidas.
      const producto = await manager.findOne(Producto, {
        where: { id: productoId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!producto) {
        throw new NotFoundException(
          `Producto con ID ${productoId} no encontrado`,
        );
      }

      const movimiento = producto.ajustarStock(
        cantidad,
        tipo,
        motivo,
        usuarioId,
      );

      await manager.update(Producto, producto.id, { stock: producto.stock });
      await manager.save(MovimientoStock, movimiento);

      return { stock: producto.stock, denominacion: producto.denominacion };
    });
  }

  private async cambiarPrecioEnTransaccion(
    productoId: number,
    precioNuevo: number,
    motivo: string,
    usuarioId?: number,
  ): Promise<{
    precioAnterior: number;
    precioActual: number;
    denominacion: string;
  }> {
    return this.dataSource.transaction(async (manager) => {
      const producto = await manager.findOne(Producto, {
        where: { id: productoId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!producto) {
        throw new NotFoundException(
          `Producto con ID ${productoId} no encontrado`,
        );
      }

      const precioAnterior = producto.precio ?? 0;
      const historial = producto.cambiarPrecio(precioNuevo, motivo, usuarioId);

      await manager.update(Producto, producto.id, {
        precio: producto.precio,
      });
      await manager.save(HistorialPrecio, historial);

      return {
        precioAnterior,
        precioActual: precioNuevo,
        denominacion: producto.denominacion,
      };
    });
  }

  private async guardarConHistorialDePrecio(
    producto: Producto,
    historial: HistorialPrecio,
  ): Promise<Producto> {
    return this.dataSource.transaction(async (manager) => {
      const entity = await manager.save(Producto, producto);
      await manager.save(HistorialPrecio, historial);
      return entity;
    });
  }

  // Mismo criterio que findActivosParaAjustePrecio del repositorio, pero dentro
  // de la transacción y bloqueando las filas para no pisar cambios concurrentes.
  private async findActivosParaAjustePrecioConLock(
    manager: EntityManager,
    lineaId?: number,
  ): Promise<Producto[]> {
    const query = manager
      .createQueryBuilder(Producto, 'producto')
      .setLock('pessimistic_write')
      .where('producto.deletedAt IS NULL');

    if (lineaId) {
      query.andWhere('producto.linea_id = :lineaId', { lineaId });
    }

    return query.getMany();
  }

  // Ej.: "Ajuste masivo +10 % (todos los productos)",
  //      "Ajuste masivo -$ 1.500 (línea BEBIDAS)".
  private async motivoAjusteMasivo(
    manager: EntityManager,
    dto: CambioPreciosMasivoDto,
    lineaId?: number,
  ): Promise<string> {
    const signo = dto.valor < 0 ? '-' : '+';
    const valor = new Intl.NumberFormat('es-AR', {
      maximumFractionDigits: 5,
    }).format(Math.abs(dto.valor));
    const ajuste =
      dto.tipo === TipoAumento.PORCENTAJE
        ? `${signo}${valor} %`
        : `${signo}$ ${valor}`;

    if (!lineaId) {
      return `Ajuste masivo ${ajuste} (todos los productos)`;
    }

    const linea = await manager.findOne(Linea, { where: { id: lineaId } });
    return `Ajuste masivo ${ajuste} (línea ${linea?.denominacion ?? lineaId})`;
  }

  private async validarYPrepararActualizacion(
    id: number,
    dto: UpdateProductoDto,
  ) {
    const productoActual = await this.repository.findOne(id);
    if (!productoActual) {
      throw new NotFoundException(
        `${this.ENTITY_NAME} con ID ${id} no encontrado.`,
      );
    }

    const lineaActualId = productoActual.linea?.id;
    const marcaActualId = productoActual.marca?.id;

    if (lineaActualId == null || marcaActualId == null) {
      throw new ConflictException(
        `${this.ENTITY_NAME} con ID ${id} en estado inválido: no posee línea o marca.`,
      );
    }

    this.intrinsicValidationService.validarDatosBasicos({
      denominacion: dto.denominacion ?? productoActual.denominacion,
      marcaId: dto.marcaId ?? marcaActualId,
      lineaId: dto.lineaId ?? lineaActualId,
      alicuotaIva: dto.alicuotaIva ?? productoActual.alicuotaIva,
    });

    // PA-023 §5: si viene, reemplaza la actual y no se puede quitar. Si no
    // viene, la presentación guardada no cambia. Las reglas del contenido se
    // validan acá; el envase, junto con las demás entidades relacionadas.
    let nuevaPresentacion: Presentacion | null = null;
    if (dto.presentacion === null) {
      productoActual.asignarPresentacion(null);
    } else if (dto.presentacion !== undefined) {
      nuevaPresentacion = Presentacion.crear(dto.presentacion);
    }

    if (dto.denominacion) {
      await this.uniquenessValidator.validarDenominacionUnica(
        dto.denominacion,
        id,
      );
    }

    const { marca, linea } =
      await this.relatedEntitiesValidator.validarYObtenerEntidadesRelacionadas(
        dto.marcaId ?? marcaActualId,
        dto.lineaId ?? lineaActualId,
      );

    this.validationService.validarEntidadesRelacionadas(marca, linea);

    if (nuevaPresentacion) {
      const envase =
        await this.relatedEntitiesValidator.validarYObtenerEnvasePresentacion(
          nuevaPresentacion.envaseId,
        );
      productoActual.asignarPresentacion(nuevaPresentacion, envase);
    }

    const usuario = await this.usuarioValidator.validarUsuarioExiste(
      dto.usuarioUpdatedId,
    );

    return { marca, linea, usuario, productoActual };
  }
}
