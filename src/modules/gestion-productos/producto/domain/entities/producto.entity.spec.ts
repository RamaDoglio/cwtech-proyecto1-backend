// domain/entities/producto.entity.spec.ts
import { Producto } from './producto.entity';
import { TipoMovimientoStock } from './movimiento-stock.entity';
import { MotivoRequeridoException } from '../../../../common/exceptions/motivo-requerido.exception';
import { StockNegativoException } from '../../../../common/exceptions/stock-negativo.exception';

describe('Producto.ajustarStock', () => {
  let producto: Producto;

  beforeEach(() => {
    producto = new Producto();
    producto.id = 1;
    producto.denominacion = 'Laptop HP';
    producto.stock = 10;
    producto.movimientos = [];
  });

  describe('casos válidos', () => {
    it('debe permitir ingreso y aumentar el stock', () => {
      producto.ajustarStock(5, TipoMovimientoStock.INGRESO);

      expect(producto.stock).toBe(15);
      expect(producto.movimientos).toHaveLength(1);
      expect(producto.movimientos[0].tipo).toBe(TipoMovimientoStock.INGRESO);
      expect(producto.movimientos[0].cantidad).toBe(5);
    });

    it('debe permitir egreso sin dejar stock negativo', () => {
      producto.ajustarStock(-3, TipoMovimientoStock.EGRESO);

      expect(producto.stock).toBe(7);
      expect(producto.movimientos[0].cantidad).toBe(-3);
    });

    it('debe permitir egreso que deje el stock exactamente en 0', () => {
      producto.ajustarStock(-10, TipoMovimientoStock.EGRESO);

      expect(producto.stock).toBe(0);
    });

    it('debe permitir ajuste manual con motivo y registrarlo', () => {
      producto.ajustarStock(
        2,
        TipoMovimientoStock.AJUSTE_MANUAL,
        'Corrección por inventario físico',
      );

      expect(producto.stock).toBe(12);
      expect(producto.movimientos[0].motivo).toBe(
        'Corrección por inventario físico',
      );
      expect(producto.movimientos[0].tipo).toBe(
        TipoMovimientoStock.AJUSTE_MANUAL,
      );
    });

    it('debe permitir ajuste automático sin motivo', () => {
      producto.ajustarStock(-2, TipoMovimientoStock.AJUSTE_AUTOMATICO);

      expect(producto.stock).toBe(8);
      expect(producto.movimientos[0].motivo).toBeUndefined();
    });

    it('debe acumular múltiples movimientos', () => {
      producto.ajustarStock(5, TipoMovimientoStock.INGRESO);
      producto.ajustarStock(-2, TipoMovimientoStock.EGRESO);
      producto.ajustarStock(1, TipoMovimientoStock.INGRESO);

      expect(producto.stock).toBe(14);
      expect(producto.movimientos).toHaveLength(3);
    });

    it('debe permitir trabajar con cantidades decimales (kg, litros)', () => {
      producto.stock = 1.5;
      producto.ajustarStock(0.25, TipoMovimientoStock.INGRESO);

      expect(producto.stock).toBe(1.75);
    });

    it('debe propagar el usuarioId al movimiento', () => {
      producto.ajustarStock(5, TipoMovimientoStock.INGRESO, undefined, 42);

      expect(producto.movimientos[0].usuarioId).toBe(42);
    });
  });

  describe('casos inválidos', () => {
    it('debe lanzar MotivoRequeridoException si AJUSTE_MANUAL sin motivo', () => {
      expect(() =>
        producto.ajustarStock(5, TipoMovimientoStock.AJUSTE_MANUAL),
      ).toThrow(MotivoRequeridoException);

      expect(producto.stock).toBe(10);
      expect(producto.movimientos).toHaveLength(0);
    });

    it('debe lanzar StockNegativoException si el resultado es negativo', () => {
      expect(() =>
        producto.ajustarStock(-15, TipoMovimientoStock.EGRESO),
      ).toThrow(StockNegativoException);

      expect(producto.stock).toBe(10);
      expect(producto.movimientos).toHaveLength(0);
    });

    it('NO debe permitir que el stock quede en -1', () => {
      producto.stock = 1;

      expect(() =>
        producto.ajustarStock(-2, TipoMovimientoStock.EGRESO),
      ).toThrow(StockNegativoException);

      expect(producto.stock).toBe(1);
    });

    it('debe lanzar error si cantidad es 0 (delegado a MovimientoStock)', () => {
      expect(() =>
        producto.ajustarStock(0, TipoMovimientoStock.INGRESO),
      ).toThrow();

      expect(producto.stock).toBe(10);
      expect(producto.movimientos).toHaveLength(0);
    });
  });
});