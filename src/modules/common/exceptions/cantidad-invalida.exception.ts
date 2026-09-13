export class CantidadInvalidaException extends Error {
  constructor(cantidad: number) {
    super(`La cantidad no puede ser 0 (recibido: ${cantidad})`);
    this.name = 'CantidadInvalidaException';
  }
}