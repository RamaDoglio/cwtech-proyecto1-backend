import { ApiProperty } from '@nestjs/swagger';

export class HistorialPrecioDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  productoId: number;

  @ApiProperty()
  precioAnterior: number;

  @ApiProperty()
  precioNuevo: number;

  @ApiProperty()
  motivo: string;

  @ApiProperty()
  fecha: Date;

  @ApiProperty({ required: false })
  usuarioId?: number;

  @ApiProperty({
    required: false,
    nullable: true,
    description: 'Nombre del usuario responsable del cambio.',
  })
  usuarioDenominacion?: string | null;
}
