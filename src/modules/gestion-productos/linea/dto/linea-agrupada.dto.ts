import { ApiProperty } from '@nestjs/swagger';
import { LineaDto } from './linea.dto';

export class LineaAgrupadaDto {
  @ApiProperty({ example: 1, description: 'ID de la SuperLínea' })
  superlineaId: number;

  @ApiProperty({ example: 'Bebidas', description: 'Denominación de la SuperLínea' })
  superlineaDenominacion: string;

  @ApiProperty({
    type: [LineaDto],
    description: 'Líneas que pertenecen a la SuperLínea',
  })
  lineas: LineaDto[];

  @ApiProperty({ example: 3, description: 'Cantidad de Líneas agrupadas' })
  total: number;
}