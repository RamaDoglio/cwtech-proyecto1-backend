import { BadRequestException } from '@nestjs/common';
import { ProductoIntrinsicValidationService } from './producto-intrinsic-validation.service';

describe('ProductoIntrinsicValidationService', () => {
  let service: ProductoIntrinsicValidationService;

  beforeEach(() => {
    service = new ProductoIntrinsicValidationService();
  });

  const datosValidos = () => ({
    denominacion: 'Leche',
    marcaId: 1,
    lineaId: 2,
  });

  it('acepta datos básicos y precios en orden creciente', () => {
    expect(() =>
      service.validarDatosBasicos({
        ...datosValidos(),
        precioMayorista: 10,
        precioCliente: 12,
        precioOcasional: 15,
        alicuotaIva: 21,
      }),
    ).not.toThrow();
  });

  it.each([
    ['denominación vacía', { denominacion: '' }, 'obligatoria'],
    ['denominación demasiado larga', { denominacion: 'x'.repeat(201) }, 'superar 200'],
    ['marca ausente', { marcaId: 0 }, 'Marca ID'],
    ['línea ausente', { lineaId: -1 }, 'Línea ID'],
    ['precio mayorista negativo', { precioMayorista: -1 }, 'mayorista'],
    ['precio cliente negativo', { precioCliente: -1 }, 'cliente'],
    ['precio ocasional negativo', { precioOcasional: -1 }, 'ocasional'],
    ['IVA menor que cero', { alicuotaIva: -1 }, 'alícuota'],
    ['IVA mayor que cien', { alicuotaIva: 101 }, 'alícuota'],
  ])('rechaza %s', (_caso, override, mensaje) => {
    expect(() =>
      service.validarDatosBasicos({ ...datosValidos(), ...override } as any),
    ).toThrow(mensaje);
  });

  it.each([
    ['mayorista supera cliente', { precioMayorista: 20, precioCliente: 10 }],
    ['cliente supera ocasional', { precioCliente: 20, precioOcasional: 10 }],
    ['mayorista supera ocasional', { precioMayorista: 20, precioOcasional: 10 }],
  ])('rechaza precios fuera de orden: %s', (_caso, override) => {
    expect(() =>
      service.validarDatosBasicos({ ...datosValidos(), ...override } as any),
    ).toThrow(BadRequestException);
  });

  it('acepta precios cero y una alícuota en los límites', () => {
    expect(() =>
      service.validarDatosBasicos({
        ...datosValidos(),
        precioMayorista: 0,
        precioCliente: 0,
        precioOcasional: 0,
        alicuotaIva: 0,
      }),
    ).not.toThrow();
    expect(() =>
      service.validarDatosBasicos({ ...datosValidos(), alicuotaIva: 100 }),
    ).not.toThrow();
  });
});
