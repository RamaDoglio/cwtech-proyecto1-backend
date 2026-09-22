import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

// Filtro del selector: sin denominación devuelve todos los envases activos.
export class BuscarEnvasePresentacionDto {
  @ApiPropertyOptional({ example: 'bot' })
  @IsOptional()
  @IsString()
  denominacion?: string;
}
