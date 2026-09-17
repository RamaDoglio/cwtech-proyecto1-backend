// domain/entities/historial-precio.entity.spec.ts
import { HistorialPrecio } from './historial-precio.entity';
import { MotivoRequeridoException } from '../../../../common/exceptions/motivo-requerido.exception';
import { PrecioInvalidoException } from '../../../../common/exceptions/precio-invalido.exception';

describe('HistorialPrecio.crear', () => {
  describe('casos válidos', () => {
    it('debe crear un registro de historial con precio anterior y nuevo', () => {
      const historial = HistorialPrecio.crear(1, 100, 150, 'Aumento de costo');

      expect(historial.productoId).toBe(1);
      expect(historial.precioAnterior).toBe(100);
      expect(historial.precioNuevo).toBe(150);
      expect(historial.motivo).toBe('Aumento de costo');
      expect(historial.usuarioId).toBeUndefined();
    });

    it('debe crear un registro con usuarioId para trazabilidad', () => {
      const historial = HistorialPrecio.crear(
        1,
        100,
        150,
        'Aumento de costo',
        42,
      );

      expect(historial.usuarioId).toBe(42);
    });

    it('debe permitir que el precio anterior sea 0', () => {
      const historial = HistorialPrecio.crear(1, 0, 50, 'Precio inicial');

      expect(historial.precioAnterior).toBe(0);
      expect(historial.precioNuevo).toBe(50);
    });
  });

  describe('casos inválidos', () => {
    it('debe lanzar PrecioInvalidoException si el precio nuevo es 0', () => {
      expect(() => HistorialPrecio.crear(1, 100, 0, 'motivo')).toThrow(
        PrecioInvalidoException,
      );
    });

    it('debe lanzar PrecioInvalidoException si el precio nuevo es negativo', () => {
      expect(() => HistorialPrecio.crear(1, 100, -10, 'motivo')).toThrow(
        PrecioInvalidoException,
      );
    });

    it('debe lanzar MotivoRequeridoException si el motivo no se envía', () => {
      expect(() =>
        HistorialPrecio.crear(1, 100, 150, undefined as unknown as string),
      ).toThrow(MotivoRequeridoException);
    });

    it('debe lanzar MotivoRequeridoException si el motivo es string vacío', () => {
      expect(() => HistorialPrecio.crear(1, 100, 150, '')).toThrow(
        MotivoRequeridoException,
      );
    });

    it('debe lanzar MotivoRequeridoException si el motivo son solo espacios', () => {
      expect(() => HistorialPrecio.crear(1, 100, 150, '   ')).toThrow(
        MotivoRequeridoException,
      );
    });
  });
});
