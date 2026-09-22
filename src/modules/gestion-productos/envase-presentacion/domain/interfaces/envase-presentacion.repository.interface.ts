import { Usuario } from 'src/modules/gestion-usuario/usuario/domain/entities/usuario.entity';
import { AuditoriaDto } from 'src/modules/gestion-sistema/auditoria/dto/auditoria.dto';
import { CreateEnvasePresentacionDto } from '../../dto/create-envase-presentacion.dto';
import { UpdateEnvasePresentacionDto } from '../../dto/update-envase-presentacion.dto';
import { EnvasePresentacion } from '../entities/envase-presentacion.entity';

export interface IEnvasePresentacionRepository {
  create(data: CreateEnvasePresentacionDto): Promise<EnvasePresentacion>;
  update(
    id: number,
    data: UpdateEnvasePresentacionDto,
  ): Promise<EnvasePresentacion>;
  findOne(id: number): Promise<EnvasePresentacion | null>;
  findAllFor(denominacion: string): Promise<EnvasePresentacion[]>;
  findBy(
    denominacion: string,
    skip: number,
    take: number,
    incluirEliminados: boolean,
  ): Promise<{ data: EnvasePresentacion[]; total: number }>;
  findByDenominacionWith(
    denominacion: string,
  ): Promise<EnvasePresentacion | null>;
  findByIdConAuditoria(id: number): Promise<AuditoriaDto | null>;
  remove(
    entity: EnvasePresentacion,
    usuario: Usuario,
  ): Promise<EnvasePresentacion>;
}
