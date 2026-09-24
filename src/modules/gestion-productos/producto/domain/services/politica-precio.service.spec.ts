import { PoliticaPrecio } from './politica-precio.service';
import { TipoAumento } from '../../../../common/enums/tipo-aumento.emun';

describe('PoliticaPrecio.calcular', () => {
  it('usa el margen general cuando no se pasa margen particular', () => {
    const precio = PoliticaPrecio.calcular(1000);
    // 1000 * 1.15 = 1150
    expect(precio).toBe(1150);
  });

  it('usa el margen particular cuando se pasa', () => {
    const precio = PoliticaPrecio.calcular(1000, 20);
    // 1000 * 1.20 = 1200
    expect(precio).toBe(1200);
  });

  it('acepta margen 0 (sin recargo)', () => {
    const precio = PoliticaPrecio.calcular(1000, 0);
    expect(precio).toBe(1000);
  });

  it('acepta costo 0', () => {
    const precio = PoliticaPrecio.calcular(0, 15);
    expect(precio).toBe(0);
  });

  it('rechaza costo negativo', () => {
    expect(() => PoliticaPrecio.calcular(-100)).toThrow(RangeError);
  });

  it('rechaza margen particular negativo', () => {
    expect(() => PoliticaPrecio.calcular(1000, -5)).toThrow(RangeError);
  });

  it('redondea a 5 decimales', () => {
    // 333.333 * 1.15 = 383.33295 -> ya tiene 5 decimales exactos
    const precio = PoliticaPrecio.calcular(333.333, 15);
    expect(precio).toBe(383.33295);
  });
});

describe('PoliticaPrecio.aplicarAjuste', () => {
  describe('tipo PORCENTAJE', () => {
    it('aplica un aumento positivo', () => {
      const nuevo = PoliticaPrecio.aplicarAjuste(1000, TipoAumento.PORCENTAJE, 10);
      expect(nuevo).toBe(1100);
    });

    it('aplica un decremento (valor negativo)', () => {
      const nuevo = PoliticaPrecio.aplicarAjuste(1000, TipoAumento.PORCENTAJE, -10);
      expect(nuevo).toBe(900);
    });

    it('un ajuste del 0% deja el precio igual', () => {
      const nuevo = PoliticaPrecio.aplicarAjuste(1000, TipoAumento.PORCENTAJE, 0);
      expect(nuevo).toBe(1000);
    });

    it('rechaza un decremento que deja el precio en 0 o negativo', () => {
      // -100% -> precio 0, inválido
      expect(() =>
        PoliticaPrecio.aplicarAjuste(1000, TipoAumento.PORCENTAJE, -100),
      ).toThrow(RangeError);

      // -150% -> precio negativo, inválido
      expect(() =>
        PoliticaPrecio.aplicarAjuste(1000, TipoAumento.PORCENTAJE, -150),
      ).toThrow(RangeError);
    });

    it('redondea correctamente con decimales feos', () => {
      // 1234.567 * 1.10 = 1358.0237
      const nuevo = PoliticaPrecio.aplicarAjuste(
        1234.567,
        TipoAumento.PORCENTAJE,
        10,
      );
      expect(nuevo).toBeCloseTo(1358.0237, 4);
    });
  });

  describe('tipo MONTO_FIJO', () => {
    it('aplica un aumento positivo', () => {
      const nuevo = PoliticaPrecio.aplicarAjuste(1000, TipoAumento.MONTO_FIJO, 100);
      expect(nuevo).toBe(1100);
    });

    it('aplica un decremento (valor negativo)', () => {
      const nuevo = PoliticaPrecio.aplicarAjuste(1000, TipoAumento.MONTO_FIJO, -100);
      expect(nuevo).toBe(900);
    });

    it('rechaza un decremento mayor al precio actual', () => {
      expect(() =>
        PoliticaPrecio.aplicarAjuste(50, TipoAumento.MONTO_FIJO, -100),
      ).toThrow(RangeError);
    });

    it('rechaza un decremento que deja el precio exactamente en 0', () => {
      expect(() =>
        PoliticaPrecio.aplicarAjuste(100, TipoAumento.MONTO_FIJO, -100),
      ).toThrow(RangeError);
    });
  });

  it('rechaza precio actual negativo', () => {
    expect(() =>
      PoliticaPrecio.aplicarAjuste(-10, TipoAumento.PORCENTAJE, 10),
    ).toThrow(RangeError);
  });

  it('acepta precio actual 0 con ajuste que lo vuelve positivo (monto)', () => {
    const nuevo = PoliticaPrecio.aplicarAjuste(0, TipoAumento.MONTO_FIJO, 50);
    expect(nuevo).toBe(50);
  });

  it('un porcentaje sobre precio actual 0 sigue dando 0, que es inválido', () => {
    expect(() =>
      PoliticaPrecio.aplicarAjuste(0, TipoAumento.PORCENTAJE, 10),
    ).toThrow(RangeError);
  });
});