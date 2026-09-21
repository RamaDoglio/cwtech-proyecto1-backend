import { Injectable, Logger } from '@nestjs/common';

import { DatabaseConnectionException } from 'src/modules/common/exceptions/database-connection.exception';
import { Usuario } from 'src/modules/gestion-usuario/usuario/domain/entities/usuario.entity';
import { AuditoriaDto } from 'src/modules/gestion-sistema/auditoria/dto/auditoria.dto';

import { ISuperLineaRepository } from '../../domain/interfaces/superlinea.repository.interface';
import { SuperLinea } from '../../domain/entities/superlinea.entity';
import { CreateSuperLineaDto } from '../../dto/create-superlinea.dto';
import { UpdateSuperLineaDto } from '../../dto/update-superlinea.dto';
import { SuperLineaPersistenceAdapter } from './superlinea.persistence-adapter';

@Injectable()
export class SuperLineaRepository implements ISuperLineaRepository {
  constructor(
    private readonly persistenceService: SuperLineaPersistenceAdapter,
  ) {}

  private readonly logger = new Logger(SuperLineaRepository.name);

  private readonly ENTITY_NAME = 'SuperLinea';

  async create(data: CreateSuperLineaDto): Promise<SuperLinea> {
    this.logger.log(`Creando un nuevo ${this.ENTITY_NAME}`);
    try {
      return await this.persistenceService.create(data);
    } catch (error) {
      throw new DatabaseConnectionException(
        'No se pudo crear la entidad en la base de datos.',
      );
    }
  }

  async update(id: number, data: UpdateSuperLineaDto): Promise<SuperLinea> {
    return this.persistenceService.update(id, data);
  }

  async findAllListado(): Promise<SuperLinea[]> {
    return this.persistenceService.findAllListado();
  }

  async findAllFor(denominacion: string): Promise<SuperLinea[]> {
    return this.persistenceService.findAllFor(denominacion);
  }

  async findOne(id: number): Promise<SuperLinea | null> {
    const entity = await this.persistenceService.findOne(id);
    return entity;
  }

  async findByDenominacion(denominacion: string): Promise<SuperLinea | null> {
    const entity =
      await this.persistenceService.findByDenominacion(denominacion);
    if (!entity) {
      this.logger.warn(
        `No se encontró ${this.ENTITY_NAME} con denominación: ${denominacion}`,
      );
      return null;
    }
    return entity;
  }

  async findByDenominacionWith(
    denominacion: string,
  ): Promise<SuperLinea | null> {
    return this.persistenceService.findByDenominacionWith(denominacion);
  }

  async findByDenominacionFiltered(
    denominacion: string,
    skip = 0,
    take = 10,
    incluirEliminados = false,
  ): Promise<{ data: SuperLinea[]; total: number }> {
    return this.persistenceService.findByDenominacionFiltered(
      denominacion,
      skip,
      take,
      incluirEliminados,
    );
  }

  async remove(data: SuperLinea, usuario: Usuario): Promise<SuperLinea> {
    return this.persistenceService.remove(data, usuario);
  }

  async removeAndReassign(
    data: SuperLinea,
    usuario: Usuario,
    superlineaDestinoId: number,
  ): Promise<number> {
    return this.persistenceService.removeAndReassign(
      data,
      usuario,
      superlineaDestinoId,
    );
  }

  async findByIdConAuditoria(id: number): Promise<AuditoriaDto | null> {
    return this.persistenceService.findByIdConAuditoria(id);
  }
}
