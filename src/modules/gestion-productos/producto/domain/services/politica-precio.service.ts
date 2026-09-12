/**
 * Costo: importe de adquisición del producto, sin margen.
 * Margen: porcentaje aplicado al costo, el particular reemplaza al general.
 * Precio: importe de venta derivado de costo y margen.
 */
export class PoliticaPrecio {
  static readonly MARGEN_GENERAL = 15;
  private static readonly DECIMALES_PRECIO = 5;

  static resolverMargen(margenParticular?: number): number {
    const margen = margenParticular ?? this.MARGEN_GENERAL;
    this.validarNumeroNoNegativo(margen, 'El margen');
    return margen;
  }

  static calcular(costo: number, margenParticular?: number): number {
    this.validarNumeroNoNegativo(costo, 'El costo');
    const margen = this.resolverMargen(margenParticular);
    const factor = 10 ** this.DECIMALES_PRECIO;

    return (
      Math.round((costo * (1 + margen / 100) + Number.EPSILON) * factor) /
      factor
    );
  }

  private static validarNumeroNoNegativo(valor: number, campo: string): void {
    if (!Number.isFinite(valor) || valor < 0) {
      throw new RangeError(`${campo} debe ser un número no negativo.`);
    }
  }
}
