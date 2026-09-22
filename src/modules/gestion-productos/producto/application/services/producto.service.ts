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
import { DataSource } from 'typeorm';

@Injectable()
export class ProductoService {
  private readonly logger = new Logger(ProductoService.name);
  private readonly ENTITY_NAME = 'Producto';

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

    ProductoMapper.applyUpdate(productoActual, dto, linea, marca, usuario);

    const entity = await this.repository.save(productoActual);

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

    // Soft delete: lo aplica la capa de aplicación
    entity.deletedAt = new Date();
    entity.usuarioDeleted = usuario;

    await this.repository.remove(entity);

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

    for (const producto of productos) {
      const precioActual = Number(producto.precio ?? 0);
      const nuevoPrecio = PoliticaPrecio.aplicarAjuste(
        precioActual,
        dto.tipo,
        dto.valor,
      );

      producto.precio = nuevoPrecio;
      await this.repository.save(producto);
    }

    const historialRepository = this.dataSource.getRepository(
      CambioPreciosMasivoHistorial,
    );

    await historialRepository.save(
      historialRepository.create({
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
    this.intrinsicValidationService.validarDatosBasicos({
      denominacion: dto.denominacion,
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

    await this.uniquenessValidator.validarDenominacionUnica(dto.denominacion);

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

    if (productoActual.lineaId == null || productoActual.marcaId == null) {
      throw new ConflictException(
        `${this.ENTITY_NAME} con ID ${id} en estado inválido: no posee línea o marca.`,
      );
    }

    this.intrinsicValidationService.validarDatosBasicos({
      denominacion: dto.denominacion ?? productoActual.denominacion,
      marcaId: dto.marcaId ?? productoActual.marcaId,
      lineaId: dto.lineaId ?? productoActual.lineaId,
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
        dto.marcaId ?? productoActual.marcaId,
        dto.lineaId ?? productoActual.lineaId,
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
