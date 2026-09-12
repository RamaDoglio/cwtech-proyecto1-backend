import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
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
import { ProductoIntrinsicValidationService } from '../../domain/services/producto-intrinsic-validation.service.ts';
import { ProductoValidationService } from '../../domain/services/producto-validation.service.ts';
import { ProductoRelatedEntitiesValidator } from '../../infraestructure/validators/producto-related-entities.validator.ts';
import { ProductoUniquenessValidator } from '../../infraestructure/validators/producto-uniqueness.validator.ts';
import { UsuarioValidator } from 'src/modules/common/utils/validation/usuario-validator';
import { ProductoDeletePolicy } from '../policies/producto-delete.policy';
import { TipoMovimientoStock } from '../../domain/entities/movimiento-stock.entity';

@Injectable()
export class ProductoService {
  private readonly logger = new Logger(ProductoService.name);
  private readonly ENTITY_NAME = 'Producto';

  constructor(
    @Inject('IProductoRepository')
    private readonly repository: IProductoRepository,
    private readonly lineaService: LineaService,

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

    const { marca, linea, usuario } = await this.validarYPrepararCreacion(dto);

    const producto = ProductoMapper.toEntityFromCreateDto(
      dto,
      linea,
      marca,
      usuario,
    );

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
    const producto = await this.repository.findOne(productoId);
    if (!producto) {
      throw new NotFoundException(`Producto con ID ${productoId} no encontrado`);
    }

    producto.ajustarStock(
      cantidad,
      TipoMovimientoStock.INGRESO,
      origen,
      usuarioId,
    );

    await this.repository.save(producto);
    return producto.stock;
  }

  async decrementarStock(
    productoId: number,
    cantidad: number,
    origen?: string,
    usuarioId?: number,
  ): Promise<number> {
    const producto = await this.repository.findOne(productoId);
    if (!producto) {
      throw new NotFoundException(`Producto con ID ${productoId} no encontrado`);
    }

    producto.ajustarStock(
      -cantidad,
      TipoMovimientoStock.EGRESO,
      origen,
      usuarioId,
    );

    await this.repository.save(producto);
    return producto.stock;
  }

  async ajustarStockManual(
    productoId: number,
    dto: AjustarStockManualDto,
  ): Promise<{ message: string; stockActual: number }> {
    await this.usuarioValidator.validarUsuarioExiste(dto.usuarioId);

    const producto = await this.repository.findOne(productoId);
    if (!producto) {
      throw new NotFoundException(`Producto con ID ${productoId} no encontrado`);
    }

    producto.ajustarStock(
      dto.cantidad,
      TipoMovimientoStock.AJUSTE_MANUAL,
      dto.motivo,
      dto.usuarioId,
    );

    await this.repository.save(producto);

    return {
      message: `Stock ajustado para "${producto.denominacion}"`,
      stockActual: producto.stock,
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

    const usuario = await this.usuarioValidator.validarUsuarioExiste(
      dto.usuarioCreatedId,
    );

    return { marca, linea, usuario };
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
      throw new InternalServerErrorException('Producto en estado inválido');
    }

    this.intrinsicValidationService.validarDatosBasicos({
      denominacion: dto.denominacion ?? productoActual.denominacion,
      marcaId: dto.marcaId ?? productoActual.marcaId,
      lineaId: dto.lineaId ?? productoActual.lineaId,
      alicuotaIva: dto.alicuotaIva ?? productoActual.alicuotaIva,
    });

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

    const usuario = await this.usuarioValidator.validarUsuarioExiste(
      dto.usuarioUpdatedId,
    );

    return { marca, linea, usuario, productoActual };
  }
}