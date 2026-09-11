import { PoliticaPrecio } from './politica-precio.service';

describe('PoliticaPrecio', () => {
  it('calcula el precio con el margen general del 15% cuando no se informa uno particular', () => {
    expect(PoliticaPrecio.calcular(100)).toBe(115);
    expect(PoliticaPrecio.resolverMargen()).toBe(15);
  });

  it('usa el margen particular por encima del margen general', () => {
    expect(PoliticaPrecio.calcular(200, 25)).toBe(250);
    expect(PoliticaPrecio.resolverMargen(25)).toBe(25);
  });

  it('redondea el precio a la precisión monetaria persistida', () => {
    expect(PoliticaPrecio.calcular(10.12345, 12.5)).toBe(11.38888);
  });

  it.each([
    ['costo negativo', -1, undefined],
    ['margen negativo', 100, -1],
    ['costo no finito', Number.POSITIVE_INFINITY, undefined],
  ])('rechaza %s', (_descripcion, costo, margen) => {
    expect(() => PoliticaPrecio.calcular(costo, margen)).toThrow(RangeError);
  });
});
