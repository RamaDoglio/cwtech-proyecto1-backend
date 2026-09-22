import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { Transactional } from 'src/modules/common/decorators/transactional.decoratos';
import { IUnitOfWork } from 'src/modules/common/unit-of-work/iunit-of-work.';
import { BasePersistenceAdapter } from 'src/modules/common/persistence/base-persistence.adapter';
import { QueryBuilderHelper } from 'src/modules/common/query-builders/query-builder-helpers';
import { handleDatabaseError } from 'src/modules/common/query-builders/database-error.helper';
import { FechaUtils } from 'src/modules/common/utils/date/fecha-utils';
import { Usuario } from 'src/modules/gestion-usuario/usuario/domain/entities/usuario.entity';
import { AuditoriaDto } from 'src/modules/gestion-sistema/auditoria/dto/auditoria.dto';
import { EnvasePresentacion } from '../../domain/entities/envase-presentacion.entity';
import { IEnvasePresentacionRepository } from '../../domain/interfaces/envase-presentacion.repository.interface';
import { CreateEnvasePresentacionDto } from '../../dto/create-envase-presentacion.dto';

@Injectable()
export class EnvasePresentacionPersistenceAdapter
  extends BasePersistenceAdapter<EnvasePresentacion>
  implements IEnvasePresentacionRepository
{
  private readonly logger = new Logger(
    EnvasePresentacionPersistenceAdapter.name,
  );

  protected readonly ALIAS = 'envase';

  // `dataSource` no se usa directo: lo lee el decorador @Transactional.
  constructor(
    @InjectRepository(EnvasePresentacion)
    repository: Repository<EnvasePresentacion>,
    private readonly dataSource: DataSource,
    @Inject('UnitOfWork') public readonly uow: IUnitOfWork,
  ) {
    super(repository);
  }

  @Transactional()
  async create(data: CreateEnvasePresentacionDto): Promise<EnvasePresentacion> {
    const repo = this.uow.getRepository(EnvasePresentacion);
    return await repo.save(repo.create(data));
  }

  @Transactional()
  async update(
    id: number,
    data: Partial<EnvasePresentacion>,
  ): Promise<EnvasePresentacion> {
    const repo = this.uow.getRepository(EnvasePresentacion);
    const existente = await repo.findOneBy({ id });
    if (!existente) {
      throw new NotFoundException(
        `Envase de presentación con ID ${id} no encontrado.`,
      );
    }
    repo.merge(existente, data);
    return await repo.save(existente);
  }

  async findOne(id: number): Promise<EnvasePresentacion | null> {
    try {
      return await this.repository.findOne({
        where: { id, deletedAt: IsNull() },
      });
    } catch (error) {
      handleDatabaseError(this.logger, 'findOne', error);
    }
  }

  async findAllFor(denominacion: string): Promise<EnvasePresentacion[]> {
    try {
      const query = this.baseQuery().andWhere(
        `UPPER(${this.ALIAS}.denominacion) LIKE :denominacion`,
        { denominacion: `%${denominacion.toUpperCase()}%` },
      );
      QueryBuilderHelper.applyOrder(query, this.ALIAS, 'denominacion', 'ASC');
      return await query.getMany();
    } catch (error) {
      handleDatabaseError(this.logger, 'findAllFor', error);
    }
  }

  async findBy(
    denominacion: string,
    skip = 0,
    take = 10,
    incluirEliminados = false,
  ): Promise<{ data: EnvasePresentacion[]; total: number }> {
    try {
      const query = this.baseQuery(incluirEliminados);

      if (denominacion) {
        query.andWhere(`UPPER(${this.ALIAS}.denominacion) LIKE :denominacion`, {
          denominacion: `%${denominacion.toUpperCase()}%`,
        });
      }

      QueryBuilderHelper.applyOrder(query, this.ALIAS, 'denominacion', 'ASC');
      QueryBuilderHelper.applyPagination(query, skip, take);

      const [data, total] = await query.getManyAndCount();
      return { data, total };
    } catch (error) {
      handleDatabaseError(this.logger, 'findBy', error);
    }
  }

  // Incluye los eliminados, igual que Marca: la denominación no se reutiliza.
  async findByDenominacionWith(
    denominacion: string,
  ): Promise<EnvasePresentacion | null> {
    try {
      return await this.baseQueryWithDeleted()
        .where(`UPPER(${this.ALIAS}.denominacion) = :denominacion`, {
          denominacion: denominacion.trim().toUpperCase(),
        })
        .getOne();
    } catch (error) {
      handleDatabaseError(this.logger, 'findByDenominacionWith', error);
    }
  }

  async findByIdConAuditoria(id: number): Promise<AuditoriaDto | null> {
    try {
      const raw = await this.baseQueryWithDeleted()
        .leftJoin(
          'usuario',
          'usuarioCreated',
          `usuarioCreated.id = ${this.ALIAS}.usuarioCreatedId`,
        )
        .leftJoin(
          'usuario',
          'usuarioUpdated',
          `usuarioUpdated.id = ${this.ALIAS}.usuarioUpdatedId`,
        )
        .leftJoin(
          'usuario',
          'usuarioDeleted',
          `usuarioDeleted.id = ${this.ALIAS}.usuarioDeletedId`,
        )
        .select([
          `${this.ALIAS}.id AS id`,
          `${this.ALIAS}.denominacion AS denominacion`,
          `${this.ALIAS}.createdAt AS createdAt`,
          `${this.ALIAS}.updatedAt AS updatedAt`,
          `${this.ALIAS}.deletedAt AS deletedAt`,
          'usuarioCreated.denominacion AS usuarioCreated',
          'usuarioUpdated.denominacion AS usuarioUpdated',
          'usuarioDeleted.denominacion AS usuarioDeleted',
        ])
        .where(`${this.ALIAS}.id = :id`, { id })
        .getRawOne();

      if (!raw) return null;

      return {
        id: raw.id,
        detalle: `Envase de presentación ${raw.denominacion}`,
        createdAt: raw.createdAt ? FechaUtils.formatFechaHora(raw.createdAt) : '',
        updatedAt: raw.updatedAt ? FechaUtils.formatFechaHora(raw.updatedAt) : '',
        deletedAt: raw.deletedAt ? FechaUtils.formatFechaHora(raw.deletedAt) : '',
        usuarioCreated: raw.usuarioCreated ?? '',
        usuarioUpdated: raw.usuarioUpdated ?? '',
        usuarioDeleted: raw.usuarioDeleted ?? '',
      };
    } catch (error) {
      handleDatabaseError(this.logger, 'findByIdConAuditoria', error);
    }
  }

  @Transactional()
  async remove(
    entity: EnvasePresentacion,
    usuario: Usuario,
  ): Promise<EnvasePresentacion> {
    const repo = this.uow.getRepository(EnvasePresentacion);
    if (entity.deletedAt) {
      throw new NotFoundException('Entidad ya eliminada.');
    }
    entity.deletedAt = new Date();
    entity.usuarioDeletedId = usuario.id;
    await repo.save(entity);
    return entity;
  }
}
