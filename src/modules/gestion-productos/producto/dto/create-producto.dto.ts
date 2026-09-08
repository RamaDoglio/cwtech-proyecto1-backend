import { Transform } from 'class-transformer';
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
  Max,
  ValidateIf,
  IsPositive,
} from 'class-validator';
import { AlicuotaIva } from 'src/modules/organizacion/enums/alicuota-iva.enum';
import { IsGreaterThanOrEqualToProperty } from 'src/modules/common/validators/cross-field.validators';

export class CreateProductoDto {
  @Transform(({ value }) => value.trim().toLowerCase())
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
  denominacion: string;

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

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'El costo debe ser mayor o igual a 0.' })
  costo?: number;

  @IsBoolean()
  utilizaPack: boolean;

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


  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'El porcentaje mínimo debe ser mayor o igual a 0.' })
  @Max(999, { message: 'El porcentaje máximo permitido es de 999.' })
  porcentaje?: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'El precio debe ser mayor o igual a 0.' })
  @IsGreaterThanOrEqualToProperty(
    'costo',
    'El precio debe ser mayor o igual que el costo.',
  )
  precio: number;

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


}
