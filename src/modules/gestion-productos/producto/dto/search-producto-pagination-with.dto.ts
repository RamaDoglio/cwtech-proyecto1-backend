import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

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
  
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return false;
    if (value === 'true' || value === true || value === 1 || value === '1') return true;
    if (value === 'false' || value === false || value === 0 || value === '0') return false;
    return value;
  })
  @IsOptional()
  @IsBoolean()
  codReferenciaExacto: boolean = false;

  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return false;
    if (value === 'true' || value === true || value === 1 || value === '1') return true;
    if (value === 'false' || value === false || value === 0 || value === '0') return false;
    return value;
  })
  @IsOptional()
  @IsBoolean()
  codProveedorExacto: boolean = false;

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
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  conStock: boolean;

}