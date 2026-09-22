import { PresentacionInvalidaException } from '../../../../common/exceptions/presentacion-invalida.exception';
import { DimensionMedida, Medida } from './medida.vo';

// Mensajes exactos de PA-023 (Anexo A del plan de CR-002).
const R1 = 'La cantidad de la presentación debe ser mayor a 0.';
const R2 = 'Unidad no admitida. Usá ml, L, g, kg o unidades.';

const capturarError = (accion: () => unknown): unknown => {
  try {
    accion();
  } catch (error) {
    return error;
  }
  throw new Error('Se esperaba una excepción y no se lanzó ninguna.');
};

const esperarPresentacionInvalida = (
  accion: () => unknown,
  mensaje: string,
) => {
  const error = capturarError(accion);
  expect(error).toBeInstanceOf(PresentacionInvalidaException);
  expect(error).toMatchObject({
    code: 'PRESENTACION_INVALIDA',
    httpStatus: 400,
    message: mensaje,
  });
};

describe('Medida', () => {
  describe('crear — contenido válido', () => {
    it.each([
      [500, 'ml', '500 ml', { cantidad: 500, unidad: 'ml' }],
      [1, 'L', '1 L', { cantidad: 1, unidad: 'L' }],
      [1, 'l', '1 L', { cantidad: 1, unidad: 'L' }],
      [1000, 'ml', '1 L', { cantidad: 1, unidad: 'L' }],
      [0.75, 'L', '750 ml', { cantidad: 750, unidad: 'ml' }],
      [1.5, 'L', '1.5 L', { cantidad: 1.5, unidad: 'L' }],
      [2.25, 'L', '2.25 L', { cantidad: 2.25, unidad: 'L' }],
      [1125, 'ml', '1125 ml', { cantidad: 1125, unidad: 'ml' }],
      [1, 'kg', '1 kg', { cantidad: 1, unidad: 'kg' }],
      [500, 'g', '500 g', { cantidad: 500, unidad: 'g' }],
      [1.25, 'kg', '1.25 kg', { cantidad: 1.25, unidad: 'kg' }],
      [100, 'unidades', '100 unidades', { cantidad: 100, unidad: 'unidades' }],
      [1, 'unidades', '1 unidad', { cantidad: 1, unidad: 'unidades' }],
    ])('%p %s → "%s"', (cantidad, unidad, texto, respuesta) => {
      const medida = Medida.crear(cantidad, unidad);

      expect(medida.texto()).toBe(texto);
      expect(medida.aCantidadYUnidad()).toEqual(respuesta);
    });

    it.each([
      [1000, 'L', '1000 L'],
      [1000, 'kg', '1000 kg'],
      [10000, 'unidades', '10000 unidades'],
      [1, 'ml', '1 ml'],
    ])('acepta el límite %p %s', (cantidad, unidad, texto) => {
      expect(Medida.crear(cantidad, unidad).texto()).toBe(texto);
    });

    it('reconoce la unidad sin distinguir mayúsculas', () => {
      expect(Medida.crear(500, 'ML').texto()).toBe('500 ml');
      expect(Medida.crear(2, 'Kg').texto()).toBe('2 kg');
      expect(Medida.crear(500, 'G').texto()).toBe('500 g');
      expect(Medida.crear(12, 'UNIDADES').texto()).toBe('12 unidades');
    });

    it('guarda la magnitud como entero en la unidad base (N1)', () => {
      expect(Medida.crear(1.5, 'L')).toMatchObject({
        dimension: DimensionMedida.VOLUMEN,
        magnitudBase: 1500,
      });
      expect(Medida.crear(1.25, 'kg')).toMatchObject({
        dimension: DimensionMedida.MASA,
        magnitudBase: 1250,
      });
      expect(Medida.crear(12, 'unidades')).toMatchObject({
        dimension: DimensionMedida.UNIDADES,
        magnitudBase: 12,
      });
    });

    it('tolera el punto flotante al contar decimales y al convertir', () => {
      // 1.15 * 100 = 114.99999999999999 y 1.15 * 1000 = 1149.9999999999998
      const medida = Medida.crear(1.15, 'L');

      expect(medida.magnitudBase).toBe(1150);
      expect(medida.texto()).toBe('1.15 L');
    });
  });

  describe('crear — contenido inválido', () => {
    it.each([
      [0, 'ml', R1],
      [-2, 'L', R1],
      [0, 'unidades', R1],
      [Number.NaN, 'ml', R1],
      [Number.POSITIVE_INFINITY, 'L', R1],
      [500, 'm', R2],
      [3, 'docenas', R2],
      [500, '', R2],
      [2.5, 'ml', 'Los ml no admiten decimales.'],
      [2.5, 'g', 'Los g no admiten decimales.'],
      [1.5, 'unidades', 'Las unidades no admiten decimales.'],
      [1.125, 'kg', 'Los kg admiten hasta 2 decimales.'],
      [1.125, 'L', 'Los L admiten hasta 2 decimales.'],
      [1500, 'L', 'La presentación no puede superar 1000 L.'],
      [2000, 'kg', 'La presentación no puede superar 1000 kg.'],
      [20000, 'unidades', 'La presentación no puede superar 10000 unidades.'],
      [1000001, 'ml', 'La presentación no puede superar 1000 L.'],
      [1000001, 'g', 'La presentación no puede superar 1000 kg.'],
    ])('rechaza %p %s: "%s"', (cantidad, unidad, mensaje) => {
      esperarPresentacionInvalida(() => Medida.crear(cantidad, unidad), mensaje);
    });

    it.each(['lt', 'unidad', 'cc', ' ml'])(
      'no acepta alias ni espacios en la unidad (A5): "%s"',
      (unidad) => {
        esperarPresentacionInvalida(() => Medida.crear(1, unidad), R2);
      },
    );

    it('valida la unidad antes que la cantidad (A7)', () => {
      esperarPresentacionInvalida(() => Medida.crear(0, 'docenas'), R2);
    });

    it('rechaza por R1 una cantidad que no es número, por defensa (A1)', () => {
      esperarPresentacionInvalida(
        () => Medida.crear('500' as unknown as number, 'ml'),
        R1,
      );
    });
  });

  describe('igualdad', () => {
    it('1000 ml es igual a 1 L', () => {
      expect(Medida.crear(1000, 'ml').equals(Medida.crear(1, 'L'))).toBe(true);
    });

    it('500 g es distinto de 500 ml', () => {
      expect(Medida.crear(500, 'g').equals(Medida.crear(500, 'ml'))).toBe(
        false,
      );
    });
  });

  describe('desdePersistencia', () => {
    it('reconstruye la medida guardada', () => {
      const medida = Medida.desdePersistencia('VOLUMEN', 1500);

      expect(medida.texto()).toBe('1.5 L');
      expect(medida.equals(Medida.crear(1.5, 'L'))).toBe(true);
    });

    it.each([
      ['PESO', 500],
      ['VOLUMEN', 2.5],
      ['VOLUMEN', 0],
      ['VOLUMEN', 1000001],
      ['UNIDADES', 10001],
    ])(
      'trata %s / %p como dato corrupto: Error técnico, no de dominio',
      (dimension, magnitudBase) => {
        const error = capturarError(() =>
          Medida.desdePersistencia(dimension, magnitudBase),
        );

        expect(error).toBeInstanceOf(Error);
        expect(error).not.toBeInstanceOf(PresentacionInvalidaException);
      },
    );
  });
});
