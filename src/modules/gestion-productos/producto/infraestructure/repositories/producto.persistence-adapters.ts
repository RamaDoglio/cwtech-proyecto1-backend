// infraestructure/repositories/producto.persistence-adapters.ts
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DatabaseConnectionException } from 'src/modules/common/exceptions/database-connection.exception';
import { EntityNotFoundException } from 'src/modules/common/exceptions/entity-notFound-exceptions';
import { IUnitOfWork } from 'src/modules/common/unit-of-work/iunit-of-work.';
import { Repository, IsNull, DataSource } from 'typeorm';
import { Producto } from '../../domain/entities/producto.entity';
import { IProductoRepository } from '../../domain/interfaces/producto.repository-interface';
import { Linea } from 'src/modules/gestion-productos/linea/domain/entities/linea.entity';
import { Marca } from 'src/modules/gestion-productos/marca/domain/entities/marca.entity';
import { Usuario } from 'src/modules/gestion-usuario/usuario/domain/entities/usuario.entity';
import { ProductoConPrecioResuelto } from '../../domain/interfaces/producto-con-precio-resuelto.interface';
import { CreateProductoDto } from '../../dto/create-producto.dto';
import { UpdatePrecioDto } from '../../dto/update-precio.dto';
import { UpdateProductoDto } from '../../dto/update-producto.dto';

@Injectable()
export class ProductoPersistenceAdapter implements IProductoRepository {
  private readonly logger = new Logger(ProductoPersistenceAdapter.name);
  private readonly ENTITY_NAME = 'Producto';

  constructor(
    @InjectRepository(Producto)
    private readonly repository: Repository<Producto>,
    private readonly dataSource: DataSource,
    @Inject('UnitOfWork') public readonly uow: IUnitOfWork,
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

  async save(producto: Producto): Promise<Producto> {
    try {
      return await this.repository.save(producto);
    } catch (error) {
      this.logger.error(`Error al guardar ${this.ENTITY_NAME}:`, error);
      throw new DatabaseConnectionException(
        'Error al guardar en la base de datos.',
      );
    }
  }

  async remove(producto: Producto): Promise<Producto> {
    if (producto.deletedAt) {
      throw new NotFoundException('Entidad ya eliminada.');
    }

    try {
      // El service ya seteó deletedAt y usuarioDeleted
      return await this.repository.save(producto);
    } catch (error) {
      throw new DatabaseConnectionException(
        'Error al guardar en la base de datos.',
      );
    }
  }

  // ============================================================
  // Consultas individuales
  // ============================================================

  async findOne(id: number): Promise<Producto | null> {
    try {
      const entity = await this.repository
        .createQueryBuilder('producto')
        .leftJoinAndSelect('producto.linea', 'linea')
        .leftJoinAndSelect('producto.marca', 'marca')
        .where('producto.id = :id', { id })
        .andWhere('producto.deletedAt IS NULL')
        .getOne();

      if (!entity) {
        throw new EntityNotFoundException('Entidad no encontrada.');
      }
      return entity;
    } catch (error) {
      if (error instanceof EntityNotFoundException) throw error;
      throw new DatabaseConnectionException(
        'Error al conectar con la base de datos.',
      );
    }
  }

  async findByIdConAuditoria(id: number): Promise<Producto | null> {
    try {
      const entity = await this.repository
        .createQueryBuilder('producto')
        .leftJoinAndSelect('producto.usuarioCreated', 'usuarioCreated')
        .leftJoinAndSelect('producto.usuarioUpdated', 'usuarioUpdated')
        .leftJoinAndSelect('producto.usuarioDeleted', 'usuarioDeleted')
        .where('producto.id = :id', { id })
        .getOne();

      if (!entity) {
        throw new EntityNotFoundException('Entidad no encontrada.');
      }
      return entity;
    } catch (error) {
      if (error instanceof EntityNotFoundException) throw error;
      throw new DatabaseConnectionException(
        'Error al conectar con la base de datos.',
      );
    }
  }

  async findByIdWithoutRelations(id: number): Promise<Producto | null> {
    try {
      const entity = await this.repository
        .createQueryBuilder('producto')
        .where('producto.id = :id', { id })
        .andWhere('producto.deletedAt IS NULL')
        .getOne();

      if (!entity) {
        throw new EntityNotFoundException('Entidad no encontrada.');
      }
      return entity;
    } catch (error) {
      if (error instanceof EntityNotFoundException) throw error;
      throw new DatabaseConnectionException(
        'Error al conectar con la base de datos.',
      );
    }
  }

  async findByDenominacion(denominacion: string): Promise<Producto | null> {
    try {
      return await this.repository.findOne({
        where: { denominacion, deletedAt: IsNull() },
      });
    } catch (error) {
      throw new DatabaseConnectionException(
        'Error al conectar con la base de datos.',
      );
    }
  }

  async findByIds(ids: number[]): Promise<Producto[]> {
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length === 0) return [];

    return await this.repository
      .createQueryBuilder('producto')
      .where('producto.id IN (:...ids)', { ids: uniqueIds })
      .getMany();
  }

  // ============================================================
  // Consultas paginadas
  // ============================================================

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
  ): Promise<{ data: Producto[]; total: number }> {
    const query = this.repository
      .createQueryBuilder('producto')
      .leftJoinAndSelect('producto.marca', 'marca')
      .leftJoinAndSelect('producto.linea', 'linea');

    if (denominacion || codigoProveedor || codigoReferencia) {
      const condiciones: string[] = [];
      const parametros: any = {};

      if (denominacion) {
        condiciones.push(
          `UPPER(producto.denominacion) LIKE UPPER(:denominacion)`,
        );
        parametros.denominacion = `%${denominacion}%`;
      }

      if (codigoProveedor) {
        if (codProveedorExacto) {
          condiciones.push(
            `UPPER(producto.codigoProveedor) = UPPER(:codigoProveedor)`,
          );
          parametros.codigoProveedor = codigoProveedor;
        } else {
          condiciones.push(
            `UPPER(producto.codigoProveedor) LIKE UPPER(:codigoProveedor)`,
          );
          parametros.codigoProveedor = `%${codigoProveedor}%`;
        }
      }

      if (codigoReferencia) {
        condiciones.push(
          `UPPER(producto.codigoReferencia) LIKE UPPER(:codigoReferencia)`,
        );
        parametros.codigoReferencia = `%${codigoReferencia}%`;
      }

      query.andWhere(`(${condiciones.join(' OR ')})`, parametros);
    }

    if (marca_id) {
      query.andWhere('marca.id = :marca_id', { marca_id });
    }
    if (linea_id) {
      query.andWhere('linea.id = :linea_id', { linea_id });
    }
    if (conStock) {
      query.andWhere('producto.stock > 0');
    }

    query.andWhere('producto.deletedAt IS NULL');
    query.orderBy('producto.denominacion', 'ASC');
    query.skip(skip).take(take);

    const [data, total] = await query.getManyAndCount();
    return { data, total };
  }

  async findByRapido(
    codigo: string,
    exacto: boolean,
    skip: number,
    take: number,
  ): Promise<{ data: Producto[]; total: number }> {
    const query = this.repository
      .createQueryBuilder('producto')
      .leftJoinAndSelect('producto.marca', 'marca')
      .leftJoinAndSelect('producto.linea', 'linea')
      .leftJoinAndSelect('producto.proveedor', 'proveedor')
      .where('producto.deletedAt IS NULL');

    if (codigo) {
      if (exacto) {
        query.andWhere(
          '(producto.codigoProveedor = :codigo OR producto.codigoReferencia = :codigo)',
          { codigo },
        );
      } else {
        query.andWhere(
          `(
            producto.codigoProveedor LIKE :codigo OR 
            producto.codigoReferencia LIKE :codigo OR 
            producto.denominacion LIKE :codigo
          )`,
          { codigo: `%${codigo}%` },
        );
      }
    }

    query.orderBy('producto.denominacion', 'ASC');
    query.skip(skip).take(take);

    const [data, total] = await query.getManyAndCount();
    return { data, total };
  }

  async findByDenominacionCodigoProveedorFiltered(
    denominacion: string,
    skip = 0,
    take = 10,
  ): Promise<{ data: Producto[]; total: number }> {
    try {
      const query = this.repository
        .createQueryBuilder('producto')
        .leftJoinAndSelect('producto.marca', 'marca')
        .leftJoinAndSelect('producto.linea', 'linea');

      query.andWhere('producto.deletedAt IS NULL');
      query.orderBy('producto.denominacion', 'ASC');
      query.skip(skip).take(take);

      const [data, total] = await query.getManyAndCount();
      return { data, total };
    } catch (error) {
      throw new DatabaseConnectionException(
        'Error al conectar con la base de datos.',
      );
    }
  }

  // ============================================================
  // Existencias
  // ============================================================

  async isCodigoProveedorDuplicado(
    codigoProveedor: string | null,
    id?: number,
  ): Promise<boolean> {
    if (
      !codigoProveedor ||
      codigoProveedor.trim() === '' ||
      codigoProveedor === '0'
    ) {
      return false;
    }

    const query = this.repository
      .createQueryBuilder('producto')
      .where('producto.codigoProveedor = :codigoProveedor', {
        codigoProveedor,
      });

    if (id) {
      query.andWhere('producto.id != :id', { id });
    }

    return await query.getExists();
  }

  async existsByDenominacion(
    denominacion: string,
    excludeId?: number,
  ): Promise<boolean> {
    try {
      const queryBuilder = this.repository
        .createQueryBuilder('producto')
        .where('producto.denominacion = :denominacion', { denominacion })
        .andWhere('producto.deletedAt IS NULL');

      if (excludeId) {
        queryBuilder.andWhere('producto.id != :excludeId', { excludeId });
      }

      const count = await queryBuilder.getCount();
      return count > 0;
    } catch (error) {
      this.logger.error(`Error verificando existencia de denominación: ${error}`);
      throw new DatabaseConnectionException(
        'Error al conectar con la base de datos.',
      );
    }
  }

  async existsByCodigoProveedor(
    codigoProveedor: string,
    excludeId: number,
  ): Promise<boolean> {
    try {
      const queryBuilder = this.repository
        .createQueryBuilder('producto')
        .where('producto.codigoProveedor = :codigoProveedor', {
          codigoProveedor,
        })
        .andWhere('producto.deletedAt IS NULL');

      if (excludeId) {
        queryBuilder.andWhere('producto.id != :excludeId', { excludeId });
      }

      const count = await queryBuilder.getCount();
      return count > 0;
    } catch (error) {
      this.logger.error(`Error verificando existencia de código: ${error}`);
      throw new DatabaseConnectionException(
        'Error al conectar con la base de datos.',
      );
    }
  }

  async existsProductosActivosByMarca(marcaId: number): Promise<boolean> {
    const count = await this.repository
      .createQueryBuilder('producto')
      .where('producto.marca_id = :marcaId', { marcaId })
      .andWhere('producto.deletedAt IS NULL')
      .limit(1)
      .getCount();

    return count > 0;
  }

  async existsProductosActivosByLinea(lineaId: number): Promise<boolean> {
    const count = await this.repository
      .createQueryBuilder('producto')
      .where('producto.linea_id = :lineaId', { lineaId })
      .andWhere('producto.deletedAt IS NULL')
      .limit(1)
      .getCount();

    return count > 0;
  }
}
