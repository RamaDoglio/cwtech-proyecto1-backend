import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Logger,
  ParseIntPipe,
  Put,
  Query,
  UsePipes,
  UseGuards,
} from '@nestjs/common';
import { PaginationWithDenominacionSuperLineaDto } from 'src/modules/common/dto/busquedas/pagination-with-denominacion-superlinea.dto';
import { NormalizeDenominacionPipe } from 'src/modules/common/pipes/normalize-denominations.pipe';
import { AuthGuard } from 'src/modules/gestion-usuario/auth/auth.guard';
import { Roles } from 'src/modules/gestion-usuario/auth/roles.decorator';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { NormalizeDenominacionSearchPipe } from 'src/modules/common/pipes/normalize-denominations-search.pipe';
import { AuditoriaDto } from 'src/modules/gestion-sistema/auditoria/dto/auditoria.dto';
import { LineaService } from '../services/linea.service';
import { CreateLineaDto } from '../../dto/create-linea.dto';
import { LineaDto } from '../../dto/linea.dto';
import { UpdateLineaDto } from '../../dto/update-linea.dto';
import { LineaAgrupadaDto } from '../../dto/linea-agrupada.dto';

@ApiTags('Gestion Productos')
@Controller('linea')
@UseGuards(AuthGuard)
export class LineaController {
  private readonly logger = new Logger(LineaController.name);
  constructor(private readonly service: LineaService) {}

  private readonly ENTITY_NAME = 'Linea';

  @Post()
  @Roles('Root', 'Administrador', 'Empleado')
  @UsePipes(NormalizeDenominacionPipe)
  create(@Body() createDto: CreateLineaDto) {
    this.logger.log(`Creando un nuevo ${this.ENTITY_NAME}...`);
    return this.service.create(createDto);
  }

  @Get('search-by')
  @Roles('Root', 'Administrador', 'Empleado')
  @UsePipes(NormalizeDenominacionSearchPipe)
  findByDenominacionFiltered(
    @Query() paginationDto: PaginationWithDenominacionSuperLineaDto,
  ) {
    const {
      denominacion = '',
      skip,
      take,
      incluirEliminados,
      superlineaId,
    } = paginationDto;
    this.logger.log(`Buscando líneas con denominación: ${denominacion}`);
    return this.service.findByDenominacionFiltered(
      denominacion,
      skip,
      take,
      incluirEliminados,
      superlineaId,
    );
  }

  @Get('agrupadas-por-superlinea')
  @Roles('Root', 'Administrador', 'Empleado')
  @ApiOkResponse({ type: [LineaAgrupadaDto] })
  findAgrupadasPorSuperlinea(
    @Query('incluirEliminados') incluirEliminados?: string,
    @Query('superlineaId', new ParseIntPipe({ optional: true }))
    superlineaId?: number,
  ): Promise<LineaAgrupadaDto[]> {
    const incluir = incluirEliminados === 'true';
    this.logger.log(
      `Agrupando líneas por superlínea (incluirEliminados=${incluir}, superlineaId=${superlineaId})`,
    );
    return this.service.findAgrupadasPorSuperlinea(incluir, superlineaId);
  }

  @Get(':id')
  @ApiOkResponse({ type: LineaDto })
  @Roles('Root', 'Administrador', 'Empleado')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<LineaDto> {
    this.logger.log(`Buscando ${this.ENTITY_NAME} con ID: ${id}`);
    return this.service.findDtoById(+id);
  }

  @Put(':id')
  @Roles('Root', 'Administrador', 'Empleado')
  @UsePipes(NormalizeDenominacionPipe)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateLineaDto,
  ) {
    this.logger.log(`Actualizando ${this.ENTITY_NAME} con ID: ${id}`);
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('Root', 'Administrador', 'Empleado')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Query('usuarioId', ParseIntPipe) usuarioId: number,
  ) {
    this.logger.warn(
      `Eliminando ${this.ENTITY_NAME} con ID: ${id} por usuario: ${usuarioId}`,
    );
    return this.service.remove(id, usuarioId);
  }

  @Get(':id/audit')
  @Roles('Root', 'Administrador', 'Empleado')
  @ApiOkResponse({
    description: 'Informacion de auditoria',
    type: AuditoriaDto,
  })
  async findByIdConAuditoria(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AuditoriaDto> {
    return this.service.findByIdConAuditoria(id);
  }
}