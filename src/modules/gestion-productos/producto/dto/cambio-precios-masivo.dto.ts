import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNumber, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { TipoAumento } from '../../../common/enums/tipo-aumento.emun'; 
import { AlcanceAjustePrecio } from '../enums/alcance-ajuste-precio.enum';

export class CambioPreciosMasivoDto {
  @ApiProperty({ enum: TipoAumento, example: TipoAumento.PORCENTAJE })
  @IsEnum(TipoAumento)
  tipo: TipoAumento;

  @ApiProperty({
    example: 10,
    description: 'Con signo: positivo = aumento, negativo = decremento',
  })
  @IsNumber()
  @Type(() => Number)
  valor: number;

  @ApiProperty({ enum: AlcanceAjustePrecio, example: AlcanceAjustePrecio.GLOBAL })
  @IsEnum(AlcanceAjustePrecio)
  alcance: AlcanceAjustePrecio;

  @ApiProperty({
    required: false,
    description: 'Obligatorio solo si alcance = LINEA',
    example: 5,
  })
  @ValidateIf((o) => o.alcance === AlcanceAjustePrecio.LINEA)
  @IsInt()
  @Type(() => Number)
  lineaId?: number;
}