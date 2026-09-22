import { PoliticaPrecio } from './politica-precio.service';
import { TipoAumento } from '../../../../common/enums/tipo-aumento.emun';

describe('PoliticaPrecio', () => {
  it('calcula el precio con el margen general del 15% cuando no se informa uno particular', () => {
    expect(PoliticaPrecio.calcular(100)).toBe(115);
    expect(PoliticaPrecio.resolverMargen()).toBe(15);
  });

  it('usa el margen particular por encima del margen general', () => {
    expect(PoliticaPrecio.calcular(200, 25)).toBe(250);
    expect(PoliticaPrecio.resolverMargen(25)).toBe(25);
  });

  it('respeta un margen particular de 0%', () => {
    expect(PoliticaPrecio.calcular(100, 0)).toBe(100);
    expect(PoliticaPrecio.resolverMargen(0)).toBe(0);
  });

  it('redondea el precio a la precisión monetaria persistida', () => {
    expect(PoliticaPrecio.calcular(10.12345, 12.5)).toBe(11.38888);
  });

  it.each([
    ['costo negativo', -1, undefined],
    ['margen negativo', 100, -1],
    ['costo no finito', Number.POSITIVE_INFINITY, undefined],
    ['costo NaN', Number.NaN, undefined],
  ])('rechaza %s', (_descripcion, costo, margen) => {
    expect(() => PoliticaPrecio.calcular(costo, margen)).toThrow(RangeError);
  });

  //TIPO PORCENTAJE
  describe('PoliticaPrecio.aplicarAjuste - tipo PORCENTAJE', () => {
  it('aplica un aumento positivo', () => {
    expect(PoliticaPrecio.aplicarAjuste(1000, TipoAumento.PORCENTAJE, 10)).toBe(1100);
  });

  it('aplica un decremento (valor negativo)', () => {
    expect(PoliticaPrecio.aplicarAjuste(1000, TipoAumento.PORCENTAJE, -10)).toBe(900);
  });

  it('un ajuste del 0% deja el precio igual', () => {
    expect(PoliticaPrecio.aplicarAjuste(1000, TipoAumento.PORCENTAJE, 0)).toBe(1000);
  });

  it('redondea correctamente con decimales feos', () => {
    // 1234.567 * 1.10 = 1358.0237
    expect(
      PoliticaPrecio.aplicarAjuste(1234.567, TipoAumento.PORCENTAJE, 10),
    ).toBeCloseTo(1358.0237, 4);
  });

  it.each([
    ['deja el precio en 0', 1000, -100],
    ['deja el precio negativo', 1000, -150],
    ['precio actual 0, el % de 0 sigue siendo 0', 0, 10],
  ])('rechaza un ajuste que %s', (_descripcion, precioActual, valor) => {
    expect(() =>
      PoliticaPrecio.aplicarAjuste(precioActual, TipoAumento.PORCENTAJE, valor),
    ).toThrow(RangeError);
  });
});

//MONTO FIJO
describe('PoliticaPrecio.aplicarAjuste - tipo MONTO_FIJO', () => {
  it('aplica un aumento positivo', () => {
    expect(PoliticaPrecio.aplicarAjuste(1000, TipoAumento.MONTO_FIJO, 100)).toBe(1100);
  });

  it('aplica un decremento (valor negativo)', () => {
    expect(PoliticaPrecio.aplicarAjuste(1000, TipoAumento.MONTO_FIJO, -100)).toBe(900);
  });

  it('acepta precio actual 0 con un monto positivo', () => {
    expect(PoliticaPrecio.aplicarAjuste(0, TipoAumento.MONTO_FIJO, 50)).toBe(50);
  });

  it.each([
    ['el decremento supera el precio actual', 50, -100],
    ['el decremento deja el precio exactamente en 0', 100, -100],
  ])('rechaza un ajuste donde %s', (_descripcion, precioActual, valor) => {
    expect(() =>
      PoliticaPrecio.aplicarAjuste(precioActual, TipoAumento.MONTO_FIJO, valor),
    ).toThrow(RangeError);
  });
});

describe('PoliticaPrecio.aplicarAjuste - casos borde generales', () => {
  it.each([
    ['PORCENTAJE', TipoAumento.PORCENTAJE],
    ['MONTO_FIJO', TipoAumento.MONTO_FIJO],
  ])('rechaza precio actual negativo con tipo %s', (_nombre, tipo) => {
    expect(() => PoliticaPrecio.aplicarAjuste(-10, tipo, 10)).toThrow(RangeError);
  });
});

});
