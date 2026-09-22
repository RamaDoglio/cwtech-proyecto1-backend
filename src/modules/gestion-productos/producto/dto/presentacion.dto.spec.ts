import { BadRequestException, Type, ValidationPipe } from '@nestjs/common';
import { CreateProductoDto } from './create-producto.dto';
import { UpdateProductoDto } from './update-producto.dto';

// Misma configuración de transformación que el ValidationPipe global de main.ts
// (sin su exceptionFactory): con enableImplicitConversion, "500" se convertiría
// en 500. Los campos de presentación conservan el valor original para que un
// tipo equivocado lo rechace el DTO (aclaración A1 del plan de CR-002).
const pipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
  transformOptions: { enableImplicitConversion: true },
});

const validar = <T>(metatype: Type<T>, body: unknown): Promise<T> =>
  pipe.transform(body, { type: 'body', metatype });

const mensajesDeError = async (
  metatype: Type<unknown>,
  body: unknown,
): Promise<string[]> => {
  try {
    await validar(metatype, body);
  } catch (error) {
    if (error instanceof BadRequestException) {
      return (error.getResponse() as { message: string[] }).message;
    }
    throw error;
  }
  throw new Error('Se esperaba un error de validación.');
};

const productoValido = {
  denominacion: 'producto de prueba',
  costo: 100,
  utilizaStockMinimo: false,
  utilizaPack: false,
  lineaId: 1,
  marcaId: 1,
  alicuotaIva: 21,
  usuarioCreatedId: 1,
};

const botella500 = { envaseId: 1, cantidad: 500, unidad: 'ml' };

describe('PresentacionDto con la conversión implícita de main.ts', () => {
  it('acepta una presentación bien tipada y conserva los valores', async () => {
    const dto = await validar(CreateProductoDto, {
      ...productoValido,
      presentacion: { envaseId: 3, cantidad: 1.5, unidad: 'L' },
    });

    expect(dto.presentacion).toEqual({ envaseId: 3, cantidad: 1.5, unidad: 'L' });
  });

  it.each<[string, unknown, string]>([
    [
      '"1" en envaseId',
      { ...botella500, envaseId: '1' },
      'El envase de la presentación debe ser un número entero.',
    ],
    [
      '"500" en cantidad',
      { ...botella500, cantidad: '500' },
      'La cantidad de la presentación debe ser un número.',
    ],
    [
      'true en cantidad',
      { ...botella500, cantidad: true },
      'La cantidad de la presentación debe ser un número.',
    ],
    [
      '123 en unidad',
      { ...botella500, unidad: 123 },
      'La unidad de la presentación debe ser un texto.',
    ],
  ])('rechaza %s en lugar de convertirlo (A1)', async (_caso, presentacion, mensaje) => {
    const mensajes = await mensajesDeError(CreateProductoDto, {
      ...productoValido,
      presentacion,
    });

    expect(mensajes).toEqual(
      expect.arrayContaining([expect.stringContaining(mensaje)]),
    );
  });

  it('exige los tres campos: envase, valor y unidad', async () => {
    const mensajes = await mensajesDeError(CreateProductoDto, {
      ...productoValido,
      presentacion: {},
    });

    expect(mensajes).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          'El envase de la presentación debe ser un número entero.',
        ),
        expect.stringContaining(
          'La cantidad de la presentación debe ser un número.',
        ),
        expect.stringContaining('La unidad de la presentación debe ser un texto.'),
      ]),
    );
  });

  it('aplica los mismos tipos en la modificación (UpdateProductoDto los hereda)', async () => {
    const mensajes = await mensajesDeError(UpdateProductoDto, {
      denominacion: 'producto de prueba',
      usuarioUpdatedId: 1,
      presentacion: { ...botella500, cantidad: '500' },
    });

    expect(mensajes).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          'La cantidad de la presentación debe ser un número.',
        ),
      ]),
    );
  });

  it('deja pasar null: la obligatoriedad la decide el dominio (A2)', async () => {
    const dto = await validar(CreateProductoDto, {
      ...productoValido,
      presentacion: null,
    });

    expect(dto.presentacion).toBeNull();
  });

  it('no cambia la conversión implícita del resto del DTO', async () => {
    const dto = await validar(CreateProductoDto, {
      ...productoValido,
      costo: '100',
      presentacion: botella500,
    });

    expect(dto.costo).toBe(100);
  });
});
