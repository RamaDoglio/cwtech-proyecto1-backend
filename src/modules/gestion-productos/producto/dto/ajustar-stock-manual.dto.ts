import { IsNumber, IsString, IsNotEmpty, IsInt } from "class-validator";

export class AjustarStockManualDto {
  @IsNumber()
  cantidad: number;

  @IsString()
  @IsNotEmpty({ message: 'El motivo es obligatorio para ajuste manual' })
  motivo: string;

  @IsInt()
  usuarioId: number;
}