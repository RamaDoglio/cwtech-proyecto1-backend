import { PresentacionInvalidaException } from '../../../../common/exceptions/presentacion-invalida.exception';
import { Presentacion } from './presentacion.vo';

// Mensaje exacto de PA-023 (Anexo A del plan de CR-002).
const R1 = 'La cantidad de la presentación debe ser mayor a 0.';

const capturarError = (accion: () => unknown): unknown => {
  try {
    accion();
  } catch (error) {
    return error;
  }
  throw new Error('Se esperaba una excepción y no se lanzó ninguna.');
};

const botella = { id: 1, denominacion: 'BOTELLA' };
const botella500 = () =>
  Presentacion.crear({ envaseId: 1, cantidad: 500, unidad: 'ml' });

describe('Presentacion', () => {
  describe('crear', () => {
    it.each([
      [500, 'ml', 'BOTELLA 500 ml'],
      [1.5, 'L', 'BOTELLA 1.5 L'],
      [1000, 'ml', 'BOTELLA 1 L'],
      [1, 'kg', 'BOTELLA 1 kg'],
      [12, 'unidades', 'BOTELLA 12 unidades'],
      [1, 'unidades', 'BOTELLA 1 unidad'],
    ])('envase + %p %s → "%s"', (cantidad, unidad, texto) => {
      const presentacion = Presentacion.crear({ envaseId: 1, cantidad, unidad });

      expect(presentacion.texto('BOTELLA')).toBe(texto);
    });

    it('propaga las reglas del contenido (R1 a R4)', () => {
      const error = capturarError(() =>
        Presentacion.crear({ envaseId: 1, cantidad: 0, unidad: 'ml' }),
      );

      expect(error).toBeInstanceOf(PresentacionInvalidaException);
      expect(error).toMatchObject({
        code: 'PRESENTACION_INVALIDA',
        message: R1,
      });
    });

    it.each([0, -1, 1.5, Number.NaN])(
      'trata el id de envase %p como error de programación, no de dominio',
      (envaseId) => {
        const error = capturarError(() =>
          Presentacion.crear({ envaseId, cantidad: 500, unidad: 'ml' }),
        );

        expect(error).toBeInstanceOf(Error);
        expect(error).not.toBeInstanceOf(PresentacionInvalidaException);
      },
    );
  });

  describe('igualdad', () => {
    it('mismo envase y 1000 ml es igual a 1 L', () => {
      const mililitros = Presentacion.crear({
        envaseId: 1,
        cantidad: 1000,
        unidad: 'ml',
      });
      const litros = Presentacion.crear({ envaseId: 1, cantidad: 1, unidad: 'L' });

      expect(mililitros.equals(litros)).toBe(true);
    });

    it('otro envase con el mismo contenido es distinto', () => {
      const bolsa500 = Presentacion.crear({
        envaseId: 2,
        cantidad: 500,
        unidad: 'ml',
      });

      expect(botella500().equals(bolsa500)).toBe(false);
    });

    it('el mismo envase con otro contenido es distinto', () => {
      const botella1L = Presentacion.crear({
        envaseId: 1,
        cantidad: 1,
        unidad: 'L',
      });

      expect(botella500().equals(botella1L)).toBe(false);
    });
  });

  describe('persistencia', () => {
    it('persiste el envase y el contenido en las tres columnas', () => {
      expect(botella500().aPersistencia()).toEqual({
        envasePresentacionId: 1,
        presentacionDimension: 'VOLUMEN',
        presentacionMagnitudBase: 500,
      });
    });

    it('ida y vuelta devuelve una presentación igual', () => {
      const presentacion = Presentacion.crear({
        envaseId: 3,
        cantidad: 1.25,
        unidad: 'kg',
      });

      const reconstruida = Presentacion.desdePersistencia(
        presentacion.aPersistencia(),
      );

      expect(reconstruida?.equals(presentacion)).toBe(true);
    });

    it('las tres columnas en null significan que no hay presentación', () => {
      expect(
        Presentacion.desdePersistencia({
          envasePresentacionId: null,
          presentacionDimension: null,
          presentacionMagnitudBase: null,
        }),
      ).toBeNull();
    });

    it.each([
      ['envase sin contenido', 1, null, null],
      ['contenido sin envase', null, 'VOLUMEN', 500],
      ['dimensión sin magnitud', 1, 'VOLUMEN', null],
    ])(
      'trata %s como dato corrupto: Error técnico, no de dominio',
      (_descripcion, envaseId, dimension, magnitudBase) => {
        const error = capturarError(() =>
          Presentacion.desdePersistencia({
            envasePresentacionId: envaseId,
            presentacionDimension: dimension,
            presentacionMagnitudBase: magnitudBase,
          }),
        );

        expect(error).toBeInstanceOf(Error);
        expect(error).not.toBeInstanceOf(PresentacionInvalidaException);
      },
    );
  });

  describe('aRespuesta', () => {
    it('devuelve el envase, el contenido normalizado y el texto', () => {
      const presentacion = Presentacion.crear({
        envaseId: 1,
        cantidad: 1500,
        unidad: 'ml',
      });

      expect(presentacion.aRespuesta(botella)).toEqual({
        envase: { id: 1, denominacion: 'BOTELLA' },
        contenido: { cantidad: 1.5, unidad: 'L' },
        texto: 'BOTELLA 1.5 L',
      });
    });

    it('sin denominación de envase, el texto es solo el contenido', () => {
      expect(botella500().texto('')).toBe('500 ml');
    });
  });
});
