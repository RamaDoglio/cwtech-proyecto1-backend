import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { PaginationWithDenominacionDto } from './pagination-with-denominacion.dto';

export class PaginationWithDenominacionSuperLineaDto extends PaginationWithDenominacionDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Filtrar Líneas por SuperLínea',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El superlineaId debe ser un número entero.' })
  @Min(1, { message: 'El superlineaId debe ser mayor a cero.' })
  superlineaId?: number;
}