import { ApiProperty } from '@nestjs/swagger';

export class EnvasePresentacionDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'BOTELLA' })
  denominacion: string;

  @ApiProperty({ example: '' })
  observacion: string;

  @ApiProperty({
    example: 0,
    description: 'De sistema: no se puede editar ni eliminar',
  })
  sistema: number;

  @ApiProperty({
    example: null,
    nullable: true,
    description: 'Fecha de eliminación (null si está activo)',
  })
  deletedAt: string | null;
}
