import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { NormalizeDenominacionPipe } from 'src/modules/common/pipes/normalize-denominations.pipe';
import { NormalizeDenominacionSearchPipe } from 'src/modules/common/pipes/normalize-denominations-search.pipe';
import { PaginationWithDenominacionDto } from 'src/modules/common/dto/busquedas/pagination-with-denominacion.dto';
import { BuscarEnvasePresentacionDto } from '../../dto/buscar-envase-presentacion.dto';
import { AuthGuard } from 'src/modules/gestion-usuario/auth/auth.guard';
import { Roles } from 'src/modules/gestion-usuario/auth/roles.decorator';
import { AuditoriaDto } from 'src/modules/gestion-sistema/auditoria/dto/auditoria.dto';
import { CreateEnvasePresentacionDto } from '../../dto/create-envase-presentacion.dto';
import { UpdateEnvasePresentacionDto } from '../../dto/update-envase-presentacion.dto';
import { EnvasePresentacionDto } from '../../dto/envase-presentacion.dto';
import { EnvasePresentacionService } from '../services/envase-presentacion.service';

@ApiTags('Gestion Productos')
@Controller('envase-presentacion')
@UseGuards(AuthGuard)
export class EnvasePresentacionController {
  private readonly logger = new Logger(EnvasePresentacionController.name);

  constructor(private readonly service: EnvasePresentacionService) {}

  @Post()
  @Roles('Root', 'Administrador', 'Empleado')
  @UsePipes(NormalizeDenominacionPipe)
  create(@Body() dto: CreateEnvasePresentacionDto) {
    return this.service.create(dto);
  }

  @Get('search-by')
  @Roles('Root', 'Administrador', 'Empleado')
  @UsePipes(NormalizeDenominacionSearchPipe)
  findBy(@Query() dto: PaginationWithDenominacionDto) {
    const { denominacion = '', skip, take, incluirEliminados } = dto;
    return this.service.findBy(denominacion, skip, take, incluirEliminados);
  }

  // Para el selector del formulario de producto: mismos roles que el alta de producto.
  @Get('select')
  @Roles(
    'Root',
    'Administrador',
    'Empleado',
    'Repartidor',
    'Repositor',
    'Vendedor',
  )
  @UsePipes(NormalizeDenominacionSearchPipe)
  findAllFor(@Query() dto: BuscarEnvasePresentacionDto) {
    const { denominacion = '' } = dto;
    return this.service.findAllFor(denominacion);
  }

  @Get(':id')
  @Roles('Root', 'Administrador', 'Empleado')
  @ApiOkResponse({ type: EnvasePresentacionDto })
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<EnvasePresentacionDto> {
    return this.service.findDtoById(id);
  }

  @Put(':id')
  @Roles('Root', 'Administrador', 'Empleado')
  @UsePipes(NormalizeDenominacionPipe)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEnvasePresentacionDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('Root', 'Administrador', 'Empleado')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Query('usuarioId', ParseIntPipe) usuarioId: number,
  ) {
    this.logger.warn(
      `Eliminando envase de presentación ${id} por usuario ${usuarioId}`,
    );
    return this.service.remove(id, usuarioId);
  }

  @Get(':id/audit')
  @Roles('Root', 'Administrador', 'Empleado')
  @ApiOkResponse({ type: AuditoriaDto })
  findByIdConAuditoria(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AuditoriaDto> {
    return this.service.findByIdConAuditoria(id);
  }
}
