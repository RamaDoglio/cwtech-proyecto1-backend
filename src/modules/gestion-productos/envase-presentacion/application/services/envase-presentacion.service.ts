import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ensureNotSistemaEntity } from 'src/modules/common/utils/atrituto-sistema';
import { PaginacionUtils } from 'src/modules/common/utils/pagination/paginacion-utils';
import { MessageFrontUtils } from 'src/modules/common/utils/message/message-front.util';
import { UsuarioService } from 'src/modules/gestion-usuario/usuario/application/services/usuario.service';
import { EnvasePresentacion } from '../../domain/entities/envase-presentacion.entity';
import { IEnvasePresentacionRepository } from '../../domain/interfaces/envase-presentacion.repository.interface';
import { PoliticaEliminacionEnvasePresentacion } from '../../domain/services/politica-eliminacion-envase-presentacion.service';
import { CreateEnvasePresentacionDto } from '../../dto/create-envase-presentacion.dto';
import { EnvasePresentacionDto } from '../../dto/envase-presentacion.dto';
import { UpdateEnvasePresentacionDto } from '../../dto/update-envase-presentacion.dto';
import { EnvasePresentacionMapper } from '../../mappers/envase-presentacion.mapper';

@Injectable()
export class EnvasePresentacionService {
  private readonly logger = new Logger(EnvasePresentacionService.name);
  private readonly ENTITY_NAME = 'Envase de presentación';

  constructor(
    @Inject('IEnvasePresentacionRepository')
    private readonly repository: IEnvasePresentacionRepository,
    private readonly usuarioService: UsuarioService,
    private readonly politicaEliminacion: PoliticaEliminacionEnvasePresentacion,
  ) {}

  async create(dto: CreateEnvasePresentacionDto) {
    this.logger.log(`Creando ${this.ENTITY_NAME}: ${dto.denominacion}`);
    await this.validarDenominacionUnica(dto.denominacion, 0);
    await this.repository.create(dto);

    return MessageFrontUtils.createSimple(
      this.ENTITY_NAME,
      dto.denominacion,
      'creada',
    );
  }

  async update(id: number, dto: UpdateEnvasePresentacionDto) {
    this.logger.log(`Actualizando ${this.ENTITY_NAME} con ID: ${id}`);
    const envase = await this.findEntityById(id);
    ensureNotSistemaEntity(envase, this.ENTITY_NAME);

    if (dto.denominacion) {
      await this.validarDenominacionUnica(dto.denominacion, id);
    }

    const entity = await this.repository.update(id, dto);
    return MessageFrontUtils.createSimple(
      this.ENTITY_NAME,
      entity.denominacion,
      'editada',
    );
  }

  async remove(id: number, usuarioId: number) {
    const entity = await this.findEntityById(id);
    ensureNotSistemaEntity(entity, this.ENTITY_NAME);

    if (await this.politicaEliminacion.tieneProductosActivos(id)) {
      throw new ConflictException(
        'No se puede eliminar el envase porque está asociado a productos activos.',
      );
    }

    const usuario = await this.usuarioService.findOne(usuarioId);
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${usuarioId} no encontrado.`);
    }

    await this.repository.remove(entity, usuario);
    return MessageFrontUtils.createSimple(
      this.ENTITY_NAME,
      entity.denominacion,
      'eliminada',
    );
  }

  async findAllFor(
    denominacion: string,
  ): Promise<{ data: EnvasePresentacionDto[]; total: number }> {
    const result = await this.repository.findAllFor(denominacion);
    return {
      data: result.map((envase) => EnvasePresentacionMapper.toDto(envase)),
      total: result.length,
    };
  }

  async findBy(
    denominacion: string,
    skip = 0,
    take = 10,
    incluirEliminados = false,
  ): Promise<{ data: EnvasePresentacionDto[]; total: number }> {
    const result = await this.repository.findBy(
      denominacion,
      skip,
      take,
      incluirEliminados,
    );
    return {
      data: result.data.map((envase) => EnvasePresentacionMapper.toDto(envase)),
      total: PaginacionUtils.totalItems(result.total),
    };
  }

  async findDtoById(id: number): Promise<EnvasePresentacionDto> {
    return EnvasePresentacionMapper.toDto(await this.findEntityById(id));
  }

  async findEntityById(id: number): Promise<EnvasePresentacion> {
    const entity = await this.repository.findOne(id);
    if (!entity) {
      throw new NotFoundException(
        `${this.ENTITY_NAME} con ID ${id} no encontrado.`,
      );
    }
    return entity;
  }

  async findByIdConAuditoria(id: number) {
    const entity = await this.repository.findByIdConAuditoria(id);
    if (!entity) {
      throw new NotFoundException(
        `${this.ENTITY_NAME} con ID ${id} no encontrado.`,
      );
    }
    return entity;
  }

  // Igual que Marca: la denominación no se puede repetir, ni siquiera con un
  // envase eliminado (el índice único es sobre denominación + deletedAt).
  private async validarDenominacionUnica(denominacion: string, id: number) {
    const existente = await this.repository.findByDenominacionWith(denominacion);
    if (existente && existente.id !== id) {
      throw new ConflictException('Denominación ya en uso.');
    }
  }
}
