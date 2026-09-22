// mappers/producto.mapper.ts
import { Logger } from '@nestjs/common';
import { Producto } from '../domain/entities/producto.entity';
import { GetProductoDto } from '../dto/get-producto.dto';
import { CreateProductoDto } from '../dto/create-producto.dto';
import { UpdateProductoDto } from '../dto/update-producto.dto';
import { UpdatePrecioDto } from '../dto/update-precio.dto';
import { Usuario } from 'src/modules/gestion-usuario/usuario/domain/entities/usuario.entity';
import { ProductoDto } from '../dto/producto.dto';
import { Linea } from '../../linea/domain/entities/linea.entity';
import { Marca } from '../../marca/domain/entities/marca.entity';
import { toReferenciaDto } from 'src/modules/common/utils/mappers/referencia.mapper';
import { ProductoConPrecioResuelto } from '../domain/interfaces/producto-con-precio-resuelto.interface';
import { PoliticaPrecio } from '../domain/services/politica-precio.service';
import { Presentacion } from '../domain/value-objects/presentacion.vo';
import { PresentacionRespuestaDto } from '../dto/presentacion.dto';

export class ProductoMapper {
  private static readonly logger = new Logger(ProductoMapper.name);

  // ============================================================
  // NUEVOS: DTO → Entidad
  // ============================================================

  static toEntityFromCreateDto(
    dto: CreateProductoDto,
    linea: Linea,
    marca: Marca,
    usuario: Usuario,
  ): Producto {
    const producto = new Producto();

    const { margen, presentacion: _presentacion, ...camposProducto } = dto;

    // margen es parte del contrato HTTP, pero se persiste en la columna historica porcentaje.
    // presentacion la valida y la asigna el servicio con producto.asignarPresentacion().
    Object.entries(camposProducto).forEach(([key, value]) => {
      if (value !== undefined) {
        (producto as any)[key] = value;
      }
    });

    producto.porcentaje = PoliticaPrecio.resolverMargen(margen);
    producto.precio = PoliticaPrecio.calcular(producto.costo ?? 0, margen);

    producto.linea = linea;
    producto.marca = marca;
    producto.usuarioCreated = usuario;
    producto.movimientos = [];

    return producto;
  }

  static applyUpdate(
    producto: Producto,
    dto: UpdateProductoDto,
    linea: Linea,
    marca: Marca,
    usuario: Usuario,
  ): void {
    // presentacion la valida y la asigna el servicio con producto.asignarPresentacion().
    const { margen, presentacion: _presentacion, ...camposProducto } = dto;

    Object.entries(camposProducto).forEach(([key, value]) => {
      if (value !== undefined) {
        (producto as any)[key] = value;
      }
    });

    const margenResuelto = PoliticaPrecio.resolverMargen(margen ?? producto.porcentaje);
    producto.porcentaje = margenResuelto;
    producto.precio = PoliticaPrecio.calcular(producto.costo ?? 0, margenResuelto);

    producto.linea = linea;
    producto.marca = marca;
    producto.usuarioUpdated = usuario;
  }

  // ============================================================
  // EXISTENTES: Entidad → DTOs (sin cambios)
  // ============================================================

  static toBusquedaDto(entity: Producto): GetProductoDto {
    const precio = entity.precio ?? 0;
    const alicuota = entity.alicuotaIva ?? 0;

    return {
      id: entity.id,
      denominacion: entity.denominacion,
      observacion: entity.observacion ?? '',
      codigoProveedorDenominacion:
        entity.codigoProveedor + ' - ' + entity.denominacion,
      codigoProveedor: entity.codigoProveedor ?? '',
      proveedor: '',
      stock: entity.stock,
      alicuota: alicuota,
      costo: entity.costo ?? 0,
      precio: precio,
      precioConIva: +(precio * (1 + alicuota / 100)).toFixed(2),
      ubicacion: entity.ubicacion ?? '',
      utilizaStockMinimo: entity.utilizaStockMinimo,
      stockMinimo: entity.stockMinimo,
      utilizaPack: entity.utilizaPack,
      cantidadPorPack: entity.cantidadPorPack ?? 0,
      sistema: entity.sistema,
      codigoReferencia: entity.codigoReferencia ?? '',
      presentacion: ProductoMapper.toPresentacionDto(entity),
    };
  }

  static mapPrecios(
    entity: Producto,
    dto: UpdatePrecioDto & ProductoConPrecioResuelto,
    usuario: Usuario,
  ): void {
    entity.costo = dto.costo;
    entity.costoDolar = dto.costoDolar;
    entity.cotizacionDolar = dto.cotizacionDolar;
    entity.fechaCostoDolar = new Date();
    entity.fechaCosto = new Date();
    entity.usuarioUpdated = usuario;
  }

  static toDto(entity: Producto): ProductoDto {
    const alicuota = entity.alicuotaIva ?? 0;
    const precio = entity.precio ?? 0;

    return {
      id: entity.id,
      denominacion: entity.denominacion,
      observacion: entity.observacion ?? '',
      codigoProveedor: entity.codigoProveedor ?? '',
      codigoBarra: entity.codigoBarra ?? '',
      stock: entity.stock ?? 0,
      costo: entity.costo ?? 0,
      precio: entity.precio ?? 0,
      margen: entity.porcentaje ?? 15,
      costoEnDolar: entity.costoEnDolar ?? false,
      costoDolar: entity.costoDolar ?? 0,
      cotizacionDolar: entity.cotizacionDolar ?? 0,
      precioDolar: entity.precioDolar ?? 0,
      destacado: entity.destacado ?? false,
      envioGratis: entity.envioGratis ?? false,
      linea: toReferenciaDto(entity.linea),
      marca: toReferenciaDto(entity.marca),
      alicuotaIva: entity.alicuotaIva,
      ubicacion: entity.ubicacion ?? '',
      utilizaStockMinimo: entity.utilizaStockMinimo ?? false,
      stockMinimo: entity.stockMinimo ?? 0,
      utilizaPack: entity.utilizaPack ?? false,
      cantidadPorPack: entity.cantidadPorPack ?? 0,
      sistema: entity.sistema,
      codigoReferencia: entity.codigoReferencia ?? '',
      presentacion: ProductoMapper.toPresentacionDto(entity),
    };
  }

  // Usa la función estática y no entity.obtenerPresentacion(): hay llamadores
  // (y tests) que pasan objetos planos en lugar de instancias de Producto.
  // Se invoca con el nombre de la clase porque toBusquedaDto se pasa suelto a map().
  // Las consultas del repositorio traen el envase con leftJoinAndSelect.
  private static toPresentacionDto(
    entity: Producto,
  ): PresentacionRespuestaDto | null {
    const presentacion = Presentacion.desdePersistencia({
      envasePresentacionId: entity.envasePresentacionId ?? null,
      presentacionDimension: entity.presentacionDimension ?? null,
      presentacionMagnitudBase: entity.presentacionMagnitudBase ?? null,
    });

    return (
      presentacion?.aRespuesta({
        id: presentacion.envaseId,
        denominacion: entity.envasePresentacion?.denominacion ?? '',
      }) ?? null
    );
  }
}
