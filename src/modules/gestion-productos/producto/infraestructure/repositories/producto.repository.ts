// infraestructure/repositories/producto.repository.ts
import { Injectable, Logger } from '@nestjs/common';
import { Producto } from '../../domain/entities/producto.entity';
import { IProductoRepository } from '../../domain/interfaces/producto.repository-interface';
import { ProductoPersistenceAdapter } from './producto.persistence-adapters';
import { IUnitOfWork } from 'src/modules/common/unit-of-work/iunit-of-work.';
import { Linea } from 'src/modules/gestion-productos/linea/domain/entities/linea.entity';
import { Marca } from 'src/modules/gestion-productos/marca/domain/entities/marca.entity';
import { Usuario } from 'src/modules/gestion-usuario/usuario/domain/entities/usuario.entity';
import { ProductoConPrecioResuelto } from '../../domain/interfaces/producto-con-precio-resuelto.interface';
import { CreateProductoDto } from '../../dto/create-producto.dto';
import { UpdatePrecioDto } from '../../dto/update-precio.dto';
import { UpdateProductoDto } from '../../dto/update-producto.dto';

@Injectable()
export class ProductoRepository implements IProductoRepository {
  private readonly logger = new Logger(ProductoRepository.name);
  private readonly ENTITY_NAME = 'Producto';

  constructor(
    private readonly persistence: ProductoPersistenceAdapter,
  ) {}
  create(data: CreateProductoDto & ProductoConPrecioResuelto, linea: Linea, marca: Marca, usuario: Usuario): Promise<Producto> {
    throw new Error('Method not implemented.');
  }
  update(id: number, data: UpdateProductoDto & ProductoConPrecioResuelto, linea: Linea, marca: Marca, usuario: Usuario): Promise<Producto> {
    throw new Error('Method not implemented.');
  }
  updateEntity(uow: IUnitOfWork, data: Producto): Promise<Producto> {
    throw new Error('Method not implemented.');
  }
  actualizarPrecio(id: number, dto: UpdatePrecioDto & ProductoConPrecioResuelto, usuario: Usuario): Promise<void> {
    throw new Error('Method not implemented.');
  }

  // ============================================================
  // Persistencia
  // ============================================================

  save(producto: Producto): Promise<Producto> {
    this.logger.debug(`Guardando ${this.ENTITY_NAME} ID: ${producto.id ?? 'nuevo'}`);
    return this.persistence.save(producto);
  }

  remove(producto: Producto): Promise<Producto> {
    this.logger.log(`Eliminando ${this.ENTITY_NAME} ID: ${producto.id}`);
    return this.persistence.remove(producto);
  }

  // ============================================================
  // Consultas individuales
  // ============================================================

  findOne(id: number): Promise<Producto | null> {
    return this.persistence.findOne(id);
  }

  findByIdConAuditoria(id: number): Promise<Producto | null> {
    return this.persistence.findByIdConAuditoria(id);
  }

  findByIdWithoutRelations(id: number): Promise<Producto | null> {
    return this.persistence.findByIdWithoutRelations(id);
  }

  findByDenominacion(denominacion: string): Promise<Producto | null> {
    return this.persistence.findByDenominacion(denominacion);
  }

  findByIds(ids: number[]): Promise<Producto[]> {
    return this.persistence.findByIds(ids);
  }

  // ============================================================
  // Consultas paginadas
  // ============================================================

  findBy(
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
  ): Promise<{ data: Producto[]; total: number }> {
    return this.persistence.findBy(
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
  }

  findByRapido(
    codigo: string,
    exacto: boolean,
    skip: number,
    take: number,
  ): Promise<{ data: Producto[]; total: number }> {
    return this.persistence.findByRapido(codigo, exacto, skip, take);
  }

  findByDenominacionCodigoProveedorFiltered(
    denominacion: string,
    skip: number,
    take: number,
  ): Promise<{ data: Producto[]; total: number }> {
    return this.persistence.findByDenominacionCodigoProveedorFiltered(
      denominacion,
      skip,
      take,
    );
  }

  // ============================================================
  // Existencias
  // ============================================================

  existsByDenominacion(
    denominacion: string,
    excludeId?: number,
  ): Promise<boolean> {
    return this.persistence.existsByDenominacion(denominacion, excludeId);
  }

  existsByCodigoProveedor(
    codigoProveedor: string,
    excludeId: number,
  ): Promise<boolean> {
    return this.persistence.existsByCodigoProveedor(codigoProveedor, excludeId);
  }

  existsProductosActivosByMarca(marcaId: number): Promise<boolean> {
    return this.persistence.existsProductosActivosByMarca(marcaId);
  }

  existsProductosActivosByLinea(lineaId: number): Promise<boolean> {
    return this.persistence.existsProductosActivosByLinea(lineaId);
  }

  isCodigoProveedorDuplicado(
    codigoProveedor: string | null,
    id?: number,
  ): Promise<boolean> {
    return this.persistence.isCodigoProveedorDuplicado(codigoProveedor, id);
  }
}