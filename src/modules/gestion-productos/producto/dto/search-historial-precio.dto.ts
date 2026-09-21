import { IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchHistorialPrecioDto {
  @IsOptional()
  @IsInt()
  @Min(0, { message: 'skip debe ser un número entero positivo o 0' })
  @Type(() => Number)
  skip: number = 0;

  @IsOptional()
  @IsInt()
  @Min(1, { message: 'take debe ser un número entero mayor que 0' })
  @Type(() => Number)
  take: number = 10;
}
