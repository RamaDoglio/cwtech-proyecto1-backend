import { Injectable } from '@nestjs/common';
import { Usuario } from 'src/modules/gestion-usuario/usuario/domain/entities/usuario.entity';
import { AuditoriaDto } from 'src/modules/gestion-sistema/auditoria/dto/auditoria.dto';
import { EnvasePresentacion } from '../../domain/entities/envase-presentacion.entity';
import { IEnvasePresentacionRepository } from '../../domain/interfaces/envase-presentacion.repository.interface';
import { CreateEnvasePresentacionDto } from '../../dto/create-envase-presentacion.dto';
import { UpdateEnvasePresentacionDto } from '../../dto/update-envase-presentacion.dto';
import { EnvasePresentacionPersistenceAdapter } from './envase-presentacion.persistence-adapters';

@Injectable()
export class EnvasePresentacionRepository
  implements IEnvasePresentacionRepository
{
  constructor(
    private readonly persistence: EnvasePresentacionPersistenceAdapter,
  ) {}

  create(data: CreateEnvasePresentacionDto): Promise<EnvasePresentacion> {
    return this.persistence.create(data);
  }

  update(
    id: number,
    data: UpdateEnvasePresentacionDto,
  ): Promise<EnvasePresentacion> {
    return this.persistence.update(id, data);
  }

  findOne(id: number): Promise<EnvasePresentacion | null> {
    return this.persistence.findOne(id);
  }

  findAllFor(denominacion: string): Promise<EnvasePresentacion[]> {
    return this.persistence.findAllFor(denominacion);
  }

  findBy(
    denominacion: string,
    skip: number,
    take: number,
    incluirEliminados: boolean,
  ): Promise<{ data: EnvasePresentacion[]; total: number }> {
    return this.persistence.findBy(denominacion, skip, take, incluirEliminados);
  }

  findByDenominacionWith(
    denominacion: string,
  ): Promise<EnvasePresentacion | null> {
    return this.persistence.findByDenominacionWith(denominacion);
  }

  findByIdConAuditoria(id: number): Promise<AuditoriaDto | null> {
    return this.persistence.findByIdConAuditoria(id);
  }

  remove(
    entity: EnvasePresentacion,
    usuario: Usuario,
  ): Promise<EnvasePresentacion> {
    return this.persistence.remove(entity, usuario);
  }
}
