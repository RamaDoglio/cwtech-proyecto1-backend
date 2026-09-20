import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { DatabaseConnectionException } from 'src/modules/common/exceptions/database-connection.exception';
import { EntityNotFoundException } from 'src/modules/common/exceptions/entity-notFound-exceptions';
import { IUnitOfWork } from 'src/modules/common/unit-of-work/iunit-of-work.';
import { Transactional } from 'src/modules/common/decorators/transactional.decoratos';
import { Usuario } from 'src/modules/gestion-usuario/usuario/domain/entities/usuario.entity';
import { AuditoriaDto } from 'src/modules/gestion-sistema/auditoria/dto/auditoria.dto';
import { FechaUtils } from 'src/modules/common/utils/date/fecha-utils';
import { QueryBuilderHelper } from 'src/modules/common/query-builders/query-builder-helpers';
import { BasePersistenceAdapter } from 'src/modules/common/persistence/base-persistence.adapter';
import { handleDatabaseError } from 'src/modules/common/query-builders/database-error.helper';

import { SuperLinea } from '../../domain/entities/superlinea.entity';
import { ISuperLineaRepository } from '../../domain/interfaces/superlinea.repository.interface';
import { CreateSuperLineaDto } from '../../dto/create-superlinea.dto';
import { UpdateSuperLineaDto } from '../../dto/update-superlinea.dto';

@Injectable()
export class SuperLineaPersistenceAdapter
  extends BasePersistenceAdapter<SuperLinea>
  implements ISuperLineaRepository
{
  private readonly logger = new Logger(SuperLineaPersistenceAdapter.name);

  protected readonly ALIAS = 'superlinea';

  constructor(
    @InjectRepository(SuperLinea)
    repository: Repository<SuperLinea>,

    private readonly dataSource: DataSource,
    @Inject('UnitOfWork') public readonly uow: IUnitOfWork,
  ) {
    super(repository);
  }

  @Transactional()
  async create(data: CreateSuperLineaDto): Promise<SuperLinea> {
    const repo = this.uow.getRepository(SuperLinea);

    try {
      const nuevaEntity = repo.create({
        denominacion: data.denominacion,
        observacion: data.observacion,
        usuarioCreatedId: data.usuarioCreatedId,
      });

      const entityGuardada = await repo.save(nuevaEntity);

      return entityGuardada;
    } catch (error) {
      this.logger.error(`Error al conectar con la base de datos: ${error}`);
      throw new DatabaseConnectionException(
        'Error al guardar en la base de datos.',
      );
    }
  }

  @Transactional()
  async update(
    id: number,
    data: UpdateSuperLineaDto,
  ): Promise<SuperLinea> {
    const repo = this.uow.getRepository(SuperLinea);

    const entity = await repo.findOne({ where: { id } });

    if (!entity) {
      throw new NotFoundException(`SuperLínea con ID ${id} no encontrada`);
    }

    entity.denominacion = data.denominacion ?? entity.denominacion;
    entity.observacion = data.observacion ?? entity.observacion;
    entity.usuarioUpdatedId = data.usuarioUpdatedId;

    const entityActualizada = await repo.save(entity);

    return entityActualizada;
  }

  async findOne(id: number): Promise<SuperLinea | null> {
    try {
      const entity = await this.repository
        .createQueryBuilder('superlinea')
        .where('superlinea.id = :id', { id })
        .andWhere('superlinea.deletedAt IS NULL')
        .getOne();

      if (!entity) {
        throw new EntityNotFoundException('Entidad no encontrada');
      }

      return entity;
    } catch (error) {
      if (error instanceof EntityNotFoundException) {
        throw error;
      }

      throw new DatabaseConnectionException(
        'Error al conectar con la base de datos.',
      );
    }
  }

  async findAllListado(): Promise<SuperLinea[]> {
    try {
      const query = this.baseQuery();
      QueryBuilderHelper.applyOrder(query, this.ALIAS, 'denominacion', 'ASC');
      return await query.getMany();
    } catch (error) {
      handleDatabaseError(this.logger, 'findAllListado', error);
    }
  }

  async findAllFor(denominacion: string): Promise<SuperLinea[]> {
    try {
      const query = this.baseQuery();
      query.andWhere('UPPER(superlinea.denominacion) LIKE :denominacion', {
        denominacion: `%${denominacion.toUpperCase()}%`,
      });

      QueryBuilderHelper.applyOrder(query, this.ALIAS, 'denominacion', 'ASC');
      return await query.getMany();
    } catch (error) {
      handleDatabaseError(this.logger, 'findAllFor', error);
    }
  }

  async findByDenominacion(denominacion: string): Promise<SuperLinea | null> {
    try {
      const entity = await this.repository
        .createQueryBuilder('superlinea')
        .where('superlinea.denominacion = :denominacion', { denominacion })
        .andWhere('superlinea.deletedAt IS NULL')
        .getOne();

      return entity;
    } catch (error) {
      throw new DatabaseConnectionException(
        'Error al conectar con la base de datos.',
      );
    }
  }

  async findByDenominacionWith(
    denominacion: string,
  ): Promise<SuperLinea | null> {
    this.logger.log(
      `🔎 Buscando denominación (incluyendo borradas): ${denominacion}`,
    );
    try {
      const normalizada = denominacion.trim().toUpperCase();

      const entity = await this.repository
        .createQueryBuilder('superlinea')
        .withDeleted()
        .where('UPPER(superlinea.denominacion) = :denominacion', {
          denominacion: normalizada,
        })
        .getOne();

      if (!entity) {
        this.logger.log(
          ` No encontrada superlínea (ni activa ni eliminada): ${normalizada}`,
        );
        return null;
      }

      this.logger.log(
        `✅ Encontrada superlínea (puede estar activa o eliminada): ID=${entity.id}, denominación=${entity.denominacion}`,
      );
      return entity;
    } catch (error) {
      handleDatabaseError(this.logger, 'findByDenominacionWith', error);
    }
  }

  async findByDenominacionFiltered(
    denominacion: string,
    skip = 0,
    take = 10,
    incluirEliminados = false,
  ): Promise<{ data: SuperLinea[]; total: number }> {
    try {
      const query = this.baseQuery(incluirEliminados);

      if (denominacion) {
        query.andWhere(
          `UPPER(${this.ALIAS}.denominacion) LIKE :denominacion`,
          {
            denominacion: `%${denominacion.toUpperCase()}%`,
          },
        );
      }

      QueryBuilderHelper.applyOrder(query, this.ALIAS, 'denominacion', 'ASC');
      QueryBuilderHelper.applyPagination(query, skip, take);

      const [data, total] = await query.getManyAndCount();
      return { data, total };
    } catch (error) {
      handleDatabaseError(this.logger, 'findByDenominacionFiltered', error);
    }
  }

  @Transactional()
  async remove(entity: SuperLinea, usuario: Usuario): Promise<SuperLinea> {
    const repo = this.uow.getRepository(SuperLinea);

    entity.deletedAt = new Date();
    entity.usuarioDeletedId = usuario.id;
    await repo.save(entity);

    return entity;
  }

  async findByIdConAuditoria(id: number): Promise<AuditoriaDto | null> {
    try {
      const raw = await this.repository
        .createQueryBuilder('superlinea')
        .leftJoin(
          'usuario',
          'usuarioCreated',
          'usuarioCreated.id = superlinea.usuarioCreatedId',
        )
        .leftJoin(
          'usuario',
          'usuarioUpdated',
          'usuarioUpdated.id = superlinea.usuarioUpdatedId',
        )
        .leftJoin(
          'usuario',
          'usuarioDeleted',
          'usuarioDeleted.id = superlinea.usuarioDeletedId',
        )
        .addSelect([
          'superlinea.id as superlinea_id',
          'superlinea.denominacion as superlinea_denominacion',
          'superlinea.createdAt as superlinea_createdAt',
          'superlinea.updatedAt as superlinea_updatedAt',
          'superlinea.deletedAt as superlinea_deletedAt',
          'usuarioCreated.denominacion as usuarioCreated_nombre',
          'usuarioUpdated.denominacion as usuarioUpdated_nombre',
          'usuarioDeleted.denominacion as usuarioDeleted_nombre',
        ])
        .where('superlinea.id = :id', { id })
        .getRawOne();

      if (!raw) return null;

      return {
        id: raw.superlinea_id ?? 0,
        detalle: raw.superlinea_denominacion
          ? `superlinea ${raw.superlinea_denominacion}`
          : 'superlinea (sin denominación)',
        createdAt: raw.superlinea_createdAt
          ? FechaUtils.formatFechaHora(raw.superlinea_createdAt)
          : '',
        updatedAt: raw.superlinea_updatedAt
          ? FechaUtils.formatFechaHora(raw.superlinea_updatedAt)
          : '',
        deletedAt: raw.superlinea_deletedAt
          ? FechaUtils.formatFechaHora(raw.superlinea_deletedAt)
          : '',
        usuarioCreated: raw.usuarioCreated_nombre ?? '',
        usuarioUpdated: raw.usuarioUpdated_nombre ?? '',
        usuarioDeleted: raw.usuarioDeleted_nombre ?? '',
      };
    } catch (error) {
      this.logger.error(`ERROR EN findByIdConAuditoria: ${error}`);
      throw new DatabaseConnectionException(
        'Error al conectar con la base de datos.',
      );
    }
  }
}