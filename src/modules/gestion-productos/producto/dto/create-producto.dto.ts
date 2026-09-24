import { Transform, Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  Matches,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsInt,
  IsEnum,
  Min,
  ValidateIf,
  IsPositive,
  Max,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { AlicuotaIva } from 'src/modules/organizacion/enums/alicuota-iva.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PresentacionDto } from './presentacion.dto';

/**
 * El precio de venta es derivado por el backend y no forma parte de este contrato.
 */
export class CreateProductoDto {
  // CR-005: si generarDenominacionAutomatica es true, la denominación no se
  // valida acá (el backend la genera a partir de Marca + Línea + Presentación)
  // y cualquier valor enviado en este campo se ignora.
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @ValidateIf((o) => o.generarDenominacionAutomatica !== true)
  @IsString({ message: 'La denominación debe ser una cadena de texto.' }) // Valida que sea string
  @IsNotEmpty({ message: 'La denominación no puede estar vacía.' }) // Valida que no esté vacía
  @MaxLength(255, { message: 'La denominación no puede estar vacía.' })
  /*  @Matches(/^[A-Za-z0-9 áéíóúÁÉÍÓÚñÑ.\-/]+$/, {
    message:
      'La denominación solo puede contener letras, números, espacios, puntos, guiones y barras.',
  }) */
  @Matches(/^[\w áéíóúÁÉÍÓÚñÑ.\-/%]+$/, {
    message: 'La denominación contiene caracteres inválidos ',
  })
  denominacion?: string;

  @ApiPropertyOptional({
    example: false,
    description:
      'CR-005: si es true, la denominación se genera automáticamente como ' +
      '"Marca Línea Presentación" y se ignora cualquier valor enviado en `denominacion`. ' +
      'Sólo aplica al alta.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  generarDenominacionAutomatica?: boolean;

  @IsOptional()
  @IsString()
  observacion?: string;

  // si no tiene poner vacio
  @IsOptional()
  @IsString()
  codigoProveedor?: string;

  @IsOptional()
  @IsString()
  codigoBarra?: string;

  @IsOptional()
  @IsString()
  codigoReferencia?: string;

  @IsOptional()
  @IsString()
  ubicacion?: string;

  @IsBoolean()
  utilizaStockMinimo: boolean;

  @ValidateIf((o) => o.utilizaStockMinimo === true)
  @IsNotEmpty({ message: 'El stock mínimo es obligatorio.' })
  @IsInt()
  @IsPositive({ message: 'El stock mínimo debe ser mayor a 0.' })
  stockMinimo?: number;

  // Decisión de negocio (PA-011): el stock de este negocio siempre es en
  // unidades enteras, nunca fraccionario (aunque la columna en base de
  // datos sea decimal). No cambiar a @IsNumber() sin volver a confirmarlo.
  @IsOptional()
  @IsInt()
  stock?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  costoEnDolar?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  destacado?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  envioGratis?: boolean;

  @ApiProperty({
    example: 100,
    description: 'Costo de adquisición en moneda local. Es obligatorio.',
  })
  @IsNotEmpty({ message: 'El costo es obligatorio.' })
  @IsNumber()
  @Min(0, { message: 'El costo debe ser un número no negativo.' })
  costo: number;

  @IsBoolean()
  utilizaPack: boolean;

  @ApiPropertyOptional({
    example: 20,
    description:
      'Cantidad de unidades por pack. Obligatoria si utilizaPack=true.',
    minimum: 1,
  })
  @ValidateIf((o) => o.utilizaPack === true)
  @IsNotEmpty({ message: 'La cantidad por pack es obligatoria.' })
  @IsInt()
  @IsPositive({ message: 'La cantidad por pack debe ser mayor a 0.' })
  cantidadPorPack?: number;

  @IsOptional()
  @IsNumber()
  costoDolar?: number;

  @IsNotEmpty({ message: 'La linea es obligatoria.' })
  @IsInt({ message: 'La linea  debe ser un número entero.' })
  lineaId: number;


  @IsNotEmpty({ message: 'La marca es obligatoria.' })
  @IsInt({ message: 'La marca  debe ser un número entero.' })
  marcaId: number;


  @ApiPropertyOptional({
  example: 20,
  description:
    'Margen particular sobre el costo. Si se omite, se aplica el margen general del 15%.',
  minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'El margen debe ser un número no negativo.' })
  margen?: number;

  createdAt?: Date;

  @IsEnum(AlicuotaIva, {
    message:
      'tipo debe ser ALICUOTA_0  ALICUOTA_105, ALICUOTA_21, ALICUOTA_27,',
  })
  @Transform(({ value }) => {
    // Si el valor es un string, lo convierte al valor numérico del enum
    if (typeof value === 'string') {
      return AlicuotaIva[value.toUpperCase() as keyof typeof AlicuotaIva];
    }
    return value;
  })
  alicuotaIva: AlicuotaIva;

  @IsNotEmpty({ message: 'El usuarioCreatedId es obligatorio.' })
  @IsInt({ message: 'El usuarioCreatedId debe ser un número entero.' })
  usuarioCreatedId: number;

  // Opcional en el DTO a propósito: la obligatoriedad es una regla de dominio
  // con su propio código (PRESENTACION_REQUERIDA) y UpdateProductoDto la hereda
  // como opcional.
  @ApiPropertyOptional({
    type: () => PresentacionDto,
    nullable: true,
    description:
      'Obligatoria en el alta (PA-023 §5). Las reglas se validan en el dominio.',
  })
  @IsOptional()
  @IsObject({ message: 'La presentación debe ser un objeto.' })
  @ValidateNested()
  @Type(() => PresentacionDto)
  presentacion?: PresentacionDto | null;
}
