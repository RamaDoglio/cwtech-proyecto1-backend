import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ToBoolean } from 'src/modules/common/decorators/to-boolean.decorator';

export class SearchProductoPaginationWithDto {
  @ApiPropertyOptional({
    description: 'Coincidencia parcial e insensible a mayúsculas.',
    example: 'leche',
  })
  @IsOptional()
  @IsString()
  denominacion?: string;

  @ApiPropertyOptional({
    description: 'Denominación parcial de la Línea.',
    example: 'lacteos',
  })
  @IsOptional()
  @IsString()
  linea?: string;

  @ApiPropertyOptional({
    description: 'Denominación parcial de la SuperLínea.',
    example: 'bebidas',
  })
  @IsOptional()
  @IsString()
  superlinea?: string;

  @IsOptional()
  @IsString()
  codigoProveedor?: string;

  @IsOptional()
  @IsString()
  codigoReferencia?: string;
  
  @ToBoolean(false)
  @IsOptional()
  @IsBoolean()
  codReferenciaExacto: boolean = false;

  @ToBoolean(false)
  @IsOptional()
  @IsBoolean()
  codProveedorExacto: boolean = false;

  @ApiPropertyOptional({
    description: 'Incluye los productos dados de baja (soft delete).',
    default: false,
  })
  @ToBoolean(false)
  @IsOptional()
  @IsBoolean()
  incluirEliminados: boolean = false;

  @IsInt()
  @Min(0, { message: 'skip debe ser un número entero positivo o 0' })
  @Type(() => Number)
  skip: number = 0;

  @IsInt()
  @Min(1, { message: 'take debe ser un número entero mayor que 0' })
  @Type(() => Number)
  take: number = 10;


  @IsOptional()
  @Type(() => Number)
  @IsInt()
  marcaId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  lineaId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  proveedorId: number; 

  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  conStock: boolean;

}