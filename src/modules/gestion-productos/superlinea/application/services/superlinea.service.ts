import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { UsuarioService } from 'src/modules/gestion-usuario/usuario/application/services/usuario.service';
import { ensureNotSistemaEntity } from 'src/modules/common/utils/atrituto-sistema';
import { PaginacionUtils } from 'src/modules/common/utils/pagination/paginacion-utils';
import { MessageFrontUtils } from 'src/modules/common/utils/message/message-front.util';

import { ISuperLineaRepository } from '../../domain/interfaces/superlinea.repository.interface';
import { CreateSuperLineaDto } from '../../dto/create-superlinea.dto';
import { UpdateSuperLineaDto } from '../../dto/update-superlinea.dto';
import { SuperLineaDto } from '../../dto/superlinea.dto';
import { SuperLineaMapper } from '../../mappers/superlinea.mapper';
import { PoliticaEliminacionSuperLinea } from '../../services/politica-eliminacion-superlinea.service';
import { SuperLinea } from '../../domain/entities/superlinea.entity';

@Injectable()
export class SuperLineaService {
  private readonly logger = new Logger(SuperLineaService.name);

  private readonly ENTITY_NAME = 'SuperLinea';
  private readonly DENOMINACION_SIN_CLASIFICAR = 'sin clasificar';

  constructor(
    @Inject('ISuperLineaRepository')
    private readonly repository: ISuperLineaRepository,

    @Inject(forwardRef(() => PoliticaEliminacionSuperLinea))
    private readonly politicaEliminacion: PoliticaEliminacionSuperLinea,

    private readonly usuarioService: UsuarioService,
  ) {}

  async create(dto: CreateSuperLineaDto) {
    this.logger.log(
      `Creando un nuevo ${this.ENTITY_NAME} con denominación: ${dto.denominacion}`,
    );
    await this.checkDenominacionExists(dto.denominacion, 0);

    const entity = await this.repository.create(dto);

    return MessageFrontUtils.createSimple(
      `${this.ENTITY_NAME}`,
      entity.denominacion,
      'creada',
    );
  }

  async update(id: number, dto: UpdateSuperLineaDto) {
    this.logger.log(`Actualizando ${this.ENTITY_NAME} con ID: ${id}`);

    const superlinea = await this.findEntityById(id);
    ensureNotSistemaEntity(superlinea, 'SuperLinea');

    if (dto.denominacion)
      await this.checkDenominacionExists(dto.denominacion, id);

    const entity = await this.repository.update(id, dto);

    return MessageFrontUtils.createSimple(
      `${this.ENTITY_NAME}`,
      entity.denominacion,
      'editada',
    );
  }

  async findByDenominacionFiltered(
    denominacion: string,
    skip = 0,
    take = 10,
    incluirEliminados: boolean = false,
  ): Promise<{ data: SuperLineaDto[]; total: number }> {
    this.logger.log(
      `Buscando ${denominacion} skip=${skip}, take=${take}`,
    );

    const result = await this.repository.findByDenominacionFiltered(
      denominacion,
      skip,
      take,
      incluirEliminados,
    );

    const data: SuperLineaDto[] = result.data.map((s) =>
      SuperLineaMapper.toDto(s),
    );

    return {
      data,
      total: PaginacionUtils.totalItems(result.total),
    };
  }

  async findAllFor(
    denominacion: string,
  ): Promise<{ data: SuperLineaDto[]; total: number }> {
    const result = await this.repository.findAllFor(denominacion);

    const data: SuperLineaDto[] = result.map((s) =>
      SuperLineaMapper.toDto(s),
    );

    return {
      data,
      total: result.length,
    };
  }

  async findAllListado(): Promise<SuperLinea[]> {
    return this.repository.findAllListado();
  }

  async findByIdConAuditoria(id: number) {
    const entity = await this.repository.findByIdConAuditoria(id);
    if (!entity)
      throw new NotFoundException(
        `${this.ENTITY_NAME} con ID ${id} no encontrado.`,
      );

    return entity;
  }

  async findDtoById(id: number) {
    const entity = await this.repository.findOne(id);
    if (!entity)
      throw new NotFoundException(
        `${this.ENTITY_NAME} con ID ${id} no encontrado.`,
      );

    return SuperLineaMapper.toDto(entity);
  }

  async findEntityById(id: number) {
    const entity = await this.repository.findOne(id);
    if (!entity)
      throw new NotFoundException(
        `${this.ENTITY_NAME} con ID ${id} no encontrado.`,
      );

    return entity;
  }

  async remove(id: number, usuarioId: number) {
    const entity = await this.findEntityById(id);

    const sinClasificar = await this.findSinClasificar();
    if (sinClasificar.id === id) {
      throw new ConflictException(
        'No se puede eliminar la SuperLínea "Sin clasificar".',
      );
    }

    ensureNotSistemaEntity(entity, 'SuperLinea');

    const usuario = await this.usuarioService.findOne(usuarioId);
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${usuarioId} no encontrado.`);
    }

    const reasignadas = await this.politicaEliminacion.reasignarLineas(
      id,
      sinClasificar.id,
    );

    this.logger.log(
      `Reasignadas ${reasignadas} Líneas desde SuperLínea ${id} a "Sin clasificar" (ID ${sinClasificar.id}).`,
    );

    await this.repository.remove(entity, usuario);

    return MessageFrontUtils.createSimple(
      `${this.ENTITY_NAME}`,
      entity.denominacion,
      'eliminada',
    );
  }

  private async findSinClasificar(): Promise<SuperLinea> {
    const result = await this.repository.findByDenominacionFiltered(
      this.DENOMINACION_SIN_CLASIFICAR,
      0,
      1,
      false,
    );

    const sinClasificar = result.data[0];
    if (!sinClasificar) {
      throw new NotFoundException(
        'SuperLínea "Sin clasificar" no encontrada. No se puede reasignar Líneas.',
      );
    }

    return sinClasificar;
  }

  private async checkDenominacionExists(denominacion: string, id: number) {
    const denominacionNormalizada = denominacion.trim().toUpperCase();

    this.logger.log(
      `Verificando denominación: "${denominacionNormalizada}" para ID: ${id}`,
    );

    const exists = await this.repository.findByDenominacionWith(
      denominacionNormalizada,
    );

    if (exists && exists.id !== id) {
      this.logger.warn(
        `Conflicto: denominación ya está en uso: ${denominacionNormalizada} (ID existente: ${exists.id})`,
      );
      throw new ConflictException('Denominación ya en uso o esta eliminada.');
    }
  }
}