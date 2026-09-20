import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SuperLineaDto {
  @ApiProperty({ example: 1, description: 'ID de la SuperLínea' })
  @Type(() => Number)
  @IsInt()
  id: number;

  @ApiProperty({
    example: 'Bebidas',
    description: 'Denominación o nombre de la SuperLínea',
  })
  @IsString()
  @IsNotEmpty()
  denominacion: string;

  @ApiProperty({
    example: '',
    description: 'Observaciones varias sobre la SuperLínea',
  })
  @IsOptional()
  @IsString()
  observacion?: string;

  @ApiProperty({
    example: 0,
    description: 'De sistema no se puede editar ni eliminar',
  })
  @Type(() => Number)
  @IsInt()
  sistema: number;

  @ApiProperty({
    example: null,
    description: 'Fecha de eliminación (null si está activa)',
    nullable: true,
  })
  @IsOptional()
  deletedAt: string | null;
}