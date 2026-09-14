import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Matches,
} from 'class-validator';

export class AjustarStockManualDto {
  @ApiProperty({
    description:
      'Variación de stock. Use un valor positivo para ingresar y negativo para descontar.',
    example: -3,
  })
  @IsNumber({ allowNaN: false, allowInfinity: false })
  cantidad: number;

  @ApiProperty({
    description: 'Justificación del ajuste manual.',
    example: 'Recuento de inventario',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'El motivo es obligatorio para ajuste manual' })
  @Matches(/\S/, { message: 'El motivo es obligatorio para ajuste manual' })
  motivo: string;

  @ApiProperty({
    description: 'Identificador del usuario que realiza el ajuste.',
    example: 1,
  })
  @IsInt()
  usuarioId: number;
}

export class AjustarStockManualResponseDto {
  @ApiProperty({ example: 'Stock ajustado para "Yerba mate"' })
  message: string;

  @ApiProperty({
    description: 'Stock resultante luego del ajuste.',
    example: 12,
  })
  stockActual: number;
}
