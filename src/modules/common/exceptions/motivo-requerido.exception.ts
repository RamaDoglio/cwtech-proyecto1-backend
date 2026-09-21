import { DomainException } from './domain.exception';

export class MotivoRequeridoException extends DomainException {
  readonly code = 'MOTIVO_REQUERIDO';
  readonly httpStatus = 400;

  constructor(mensaje = 'El ajuste manual requiere un motivo') {
    super(mensaje);
  }
}