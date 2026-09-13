// domain/entities/movimiento-stock.entity.spec.ts
import {
  MovimientoStock,
  TipoMovimientoStock,
} from './movimiento-stock.entity';
import { MotivoRequeridoException } from '../../../../common/exceptions/motivo-requerido.exception';
import { CantidadInvalidaException } from '../../../../common/exceptions/cantidad-invalida.exception';

describe('MovimientoStock.crear', () => {
  describe('casos válidos', () => {
    it('debe crear un movimiento de INGRESO', () => {
      const mov = MovimientoStock.crear(1, TipoMovimientoStock.INGRESO, 5);

      expect(mov.productoId).toBe(1);
      expect(mov.tipo).toBe(TipoMovimientoStock.INGRESO);
      expect(mov.cantidad).toBe(5);
      expect(mov.motivo).toBeUndefined();
      expect(mov.usuarioId).toBeUndefined();
    });

    it('debe crear un movimiento de EGRESO con cantidad negativa', () => {
      const mov = MovimientoStock.crear(1, TipoMovimientoStock.EGRESO, -3);

      expect(mov.cantidad).toBe(-3);
      expect(mov.tipo).toBe(TipoMovimientoStock.EGRESO);
    });

    it('debe crear un AJUSTE_MANUAL con motivo', () => {
      const mov = MovimientoStock.crear(
        1,
        TipoMovimientoStock.AJUSTE_MANUAL,
        2,
        'Corrección por inventario',
      );

      expect(mov.tipo).toBe(TipoMovimientoStock.AJUSTE_MANUAL);
      expect(mov.motivo).toBe('Corrección por inventario');
    });

    it('debe crear un movimiento con usuarioId para trazabilidad', () => {
      const mov = MovimientoStock.crear(
        1,
        TipoMovimientoStock.INGRESO,
        5,
        undefined,
        42,
      );

      expect(mov.usuarioId).toBe(42);
    });

    it('debe permitir AJUSTE_AUTOMATICO sin motivo', () => {
      const mov = MovimientoStock.crear(
        1,
        TipoMovimientoStock.AJUSTE_AUTOMATICO,
        -1,
      );

      expect(mov.motivo).toBeUndefined();
    });
  });

  describe('casos inválidos', () => {
    it('debe lanzar CantidadInvalidaException si cantidad es 0', () => {
      expect(() =>
        MovimientoStock.crear(1, TipoMovimientoStock.INGRESO, 0),
      ).toThrow(CantidadInvalidaException);
    });

    it('debe lanzar MotivoRequeridoException si AJUSTE_MANUAL sin motivo', () => {
      expect(() =>
        MovimientoStock.crear(1, TipoMovimientoStock.AJUSTE_MANUAL, 5),
      ).toThrow(MotivoRequeridoException);
    });

    it('debe lanzar MotivoRequeridoException si motivo es string vacío', () => {
      expect(() =>
        MovimientoStock.crear(1, TipoMovimientoStock.AJUSTE_MANUAL, 5, ''),
      ).toThrow(MotivoRequeridoException);
    });
  });
});