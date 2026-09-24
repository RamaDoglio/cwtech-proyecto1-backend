import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsNumber, IsString, Min } from 'class-validator';
import { UnidadMedida } from '../domain/value-objects/medida.vo';

/*
Presentación del producto (CR-002): envase + valor + unidad. Estos DTO validan
solo la forma y los tipos (VALIDACION_DTO); las reglas del contenido (PA-023)
las valida el Value Object Presentacion (PRESENTACION_INVALIDA) y la existencia
del envase, el servicio.
*/

/**
 * Conserva el valor tal como llegó en el JSON. El ValidationPipe global usa
 * enableImplicitConversion, que convertiría "500" en 500, true en 1 o 123 en
 * "123". Así un tipo equivocado lo rechaza el DTO y no llega al dominio.
 */
const ValorOriginal = () =>
  Transform(({ obj, key }) => (obj as Record<string, unknown>)[key]);

// ============================================================
// Entrada: alta y modificación
// ============================================================

export class PresentacionDto {
  @ApiProperty({
    example: 1,
    description: 'Id del envase (GET /api/envase-presentacion/select).',
  })
  @ValorOriginal()
  @IsInt({
    message: 'El envase de la presentación debe ser un número entero.',
  })
  @Min(1, { message: 'El envase de la presentación debe ser un id válido.' })
  envaseId: number;

  @ApiProperty({ example: 500 })
  @ValorOriginal()
  @IsNumber(
    {},
    { message: 'La cantidad de la presentación debe ser un número.' },
  )
  cantidad: number;

  @ApiProperty({
    example: 'ml',
    description: 'ml, L, g, kg o unidades, sin distinguir mayúsculas.',
  })
  @ValorOriginal()
  @IsString({ message: 'La unidad de la presentación debe ser un texto.' })
  unidad: string;
}

// ============================================================
// Salida: consultas
// ============================================================

export class EnvasePresentacionReferenciaDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'BOTELLA' })
  denominacion: string;
}

export class ContenidoPresentacionRespuestaDto {
  @ApiProperty({ example: 500 })
  cantidad: number;

  @ApiProperty({ example: 'ml', enum: ['ml', 'L', 'g', 'kg', 'unidades'] })
  unidad: UnidadMedida;
}

export class PresentacionRespuestaDto {
  @ApiProperty({ type: () => EnvasePresentacionReferenciaDto })
  envase: EnvasePresentacionReferenciaDto;

  @ApiProperty({ type: () => ContenidoPresentacionRespuestaDto })
  contenido: ContenidoPresentacionRespuestaDto;

  @ApiProperty({
    example: 'BOTELLA 500 ml',
    description: 'Texto canónico: envase y contenido.',
  })
  texto: string;
}
