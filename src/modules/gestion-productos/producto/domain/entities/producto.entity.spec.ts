// domain/entities/producto.entity.spec.ts
import { Producto } from './producto.entity';
import { TipoMovimientoStock } from './movimiento-stock.entity';
import { MotivoRequeridoException } from '../../../../common/exceptions/motivo-requerido.exception';
import { StockNegativoException } from '../../../../common/exceptions/stock-negativo.exception';
import { PrecioInvalidoException } from '../../../../common/exceptions/precio-invalido.exception';
import { PresentacionRequeridaException } from '../../../../common/exceptions/presentacion-requerida.exception';
import { Presentacion } from '../value-objects/presentacion.vo';
import { EnvasePresentacion } from '../../../envase-presentacion/domain/entities/envase-presentacion.entity';

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

describe('Producto.cambiarPrecio', () => {
  let producto: Producto;

  beforeEach(() => {
    producto = new Producto();
    producto.id = 1;
    producto.denominacion = 'Laptop HP';
    producto.precio = 100;
    producto.historialPrecios = [];
  });

  describe('casos válidos', () => {
    it('debe actualizar el precio y registrar el historial', () => {
      const historial = producto.cambiarPrecio(150, 'Aumento de costo', 1);

      expect(producto.precio).toBe(150);
      expect(producto.historialPrecios).toHaveLength(1);
      expect(historial.precioAnterior).toBe(100);
      expect(historial.precioNuevo).toBe(150);
      expect(historial.motivo).toBe('Aumento de costo');
      expect(historial.usuarioId).toBe(1);
    });

    it('debe registrar precioAnterior como 0 si el producto nunca tuvo precio', () => {
      producto.precio = undefined;

      const historial = producto.cambiarPrecio(80, 'Precio inicial');

      expect(historial.precioAnterior).toBe(0);
      expect(producto.precio).toBe(80);
    });

    it('debe acumular múltiples cambios en el historial', () => {
      producto.cambiarPrecio(120, 'Ajuste 1');
      producto.cambiarPrecio(140, 'Ajuste 2');

      expect(producto.precio).toBe(140);
      expect(producto.historialPrecios).toHaveLength(2);
    });
  });

  describe('casos inválidos', () => {
    it('debe lanzar PrecioInvalidoException si el precio nuevo es 0 y no modificar el producto', () => {
      expect(() => producto.cambiarPrecio(0, 'motivo')).toThrow(
        PrecioInvalidoException,
      );

      expect(producto.precio).toBe(100);
      expect(producto.historialPrecios).toHaveLength(0);
    });

    it('debe lanzar MotivoRequeridoException si falta el motivo y no modificar el producto', () => {
      expect(() =>
        producto.cambiarPrecio(150, undefined as unknown as string),
      ).toThrow(MotivoRequeridoException);

      expect(producto.precio).toBe(100);
      expect(producto.historialPrecios).toHaveLength(0);
    });
  });
});

describe('Producto — presentación', () => {
  let producto: Producto;

  const envase = (id: number, denominacion: string) =>
    Object.assign(new EnvasePresentacion(), { id, denominacion });
  const botella = envase(1, 'BOTELLA');
  const bolsa = envase(2, 'BOLSA');

  const botella500 = () =>
    Presentacion.crear({ envaseId: 1, cantidad: 500, unidad: 'ml' });

  const columnas = (p: Producto) => [
    p.envasePresentacionId,
    p.presentacionDimension,
    p.presentacionMagnitudBase,
  ];

  beforeEach(() => {
    producto = new Producto();
    producto.id = 1;
    producto.denominacion = 'ACEITE GIRASOL NATURA';
  });

  it('un producto sin las columnas cargadas no tiene presentación', () => {
    expect(producto.obtenerPresentacion()).toBeNull();
  });

  it('asigna BOTELLA 500 ml en las columnas y en la relación', () => {
    const presentacion = botella500();

    producto.asignarPresentacion(presentacion, botella);

    expect(columnas(producto)).toEqual([1, 'VOLUMEN', 500]);
    expect(producto.envasePresentacion).toBe(botella);
    expect(producto.obtenerPresentacion()?.equals(presentacion)).toBe(true);
  });

  it('reemplaza la presentación por BOLSA 1 kg', () => {
    producto.asignarPresentacion(botella500(), botella);

    producto.asignarPresentacion(
      Presentacion.crear({ envaseId: 2, cantidad: 1, unidad: 'kg' }),
      bolsa,
    );

    expect(columnas(producto)).toEqual([2, 'MASA', 1000]);
    expect(producto.envasePresentacion).toBe(bolsa);
  });

  it('exige que el envase recibido sea el de la presentación', () => {
    expect(() => producto.asignarPresentacion(botella500(), bolsa)).toThrow(
      'El envase indicado no corresponde al de la presentación.',
    );
    expect(() => producto.asignarPresentacion(botella500())).toThrow(
      'El envase indicado no corresponde al de la presentación.',
    );
    expect(producto.obtenerPresentacion()).toBeNull();
  });

  it('no deja quitar una presentación cargada y conserva las columnas', () => {
    producto.asignarPresentacion(botella500(), botella);

    expect(() => producto.asignarPresentacion(null)).toThrow(
      PresentacionRequeridaException,
    );
    expect(columnas(producto)).toEqual([1, 'VOLUMEN', 500]);
  });

  it('con null, un producto anterior a CR-002 sigue sin presentación', () => {
    producto.envasePresentacionId = null;
    producto.presentacionDimension = null;
    producto.presentacionMagnitudBase = null;

    expect(() => producto.asignarPresentacion(null)).not.toThrow();
    expect(columnas(producto)).toEqual([null, null, null]);
    expect(producto.obtenerPresentacion()).toBeNull();
  });

  it('no modifica la denominación (A3)', () => {
    producto.asignarPresentacion(botella500(), botella);

    expect(producto.denominacion).toBe('ACEITE GIRASOL NATURA');
  });
});
