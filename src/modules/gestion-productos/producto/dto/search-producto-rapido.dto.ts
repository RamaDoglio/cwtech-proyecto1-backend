import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ToBoolean } from 'src/modules/common/decorators/to-boolean.decorator';

export class SearchProductoRapidoDto {

  @IsOptional()
  @IsString()
  codigo: string;

  @ToBoolean(false)
  @IsBoolean()
  exacto: boolean = false;

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


}
