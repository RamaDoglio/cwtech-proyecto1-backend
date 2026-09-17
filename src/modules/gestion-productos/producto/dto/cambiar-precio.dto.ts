import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  Matches,
} from 'class-validator';

export class CambiarPrecioDto {
  @ApiProperty({
    description: 'Nuevo precio de venta del producto. Debe ser mayor que 0.',
    example: 1500.5,
  })
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @IsPositive({ message: 'El precio nuevo debe ser mayor que 0' })
  precioNuevo: number;

  @ApiProperty({
    description: 'Justificación del cambio de precio.',
    example: 'Actualización por aumento de costo del proveedor',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'El motivo es obligatorio para cambiar el precio' })
  @Matches(/\S/, { message: 'El motivo es obligatorio para cambiar el precio' })
  motivo: string;

  @ApiProperty({
    description: 'Identificador del usuario que realiza el cambio.',
    example: 1,
  })
  @IsInt()
  usuarioId: number;
}

export class CambiarPrecioResponseDto {
  @ApiProperty({ example: 'Precio actualizado para "Yerba mate"' })
  message: string;

  @ApiProperty({ description: 'Precio anterior al cambio.', example: 1200 })
  precioAnterior: number;

  @ApiProperty({ description: 'Precio nuevo vigente.', example: 1500.5 })
  precioActual: number;
}
