export class MotivoRequeridoException extends Error {
  constructor() {
    super('El ajuste manual requiere un motivo');
    this.name = 'MotivoRequeridoException';
  }
}