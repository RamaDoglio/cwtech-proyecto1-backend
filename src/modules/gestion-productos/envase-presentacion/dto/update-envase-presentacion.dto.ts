import { PartialType } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';
import { CreateEnvasePresentacionDto } from './create-envase-presentacion.dto';

export class UpdateEnvasePresentacionDto extends PartialType(
  CreateEnvasePresentacionDto,
) {
  @IsNotEmpty({ message: 'El usuarioUpdatedId es obligatorio.' })
  @IsInt({ message: 'El usuarioUpdatedId debe ser un número entero.' })
  usuarioUpdatedId: number;
}
