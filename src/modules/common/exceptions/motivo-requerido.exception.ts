import { DomainException } from './domain.exception';

export class MotivoRequeridoException extends DomainException {
  readonly code = 'MOTIVO_REQUERIDO';
  readonly httpStatus = 400;

  constructor() {
    super('El ajuste manual requiere un motivo');
  }
}