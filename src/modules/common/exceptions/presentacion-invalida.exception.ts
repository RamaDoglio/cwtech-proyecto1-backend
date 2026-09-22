import { DomainException } from './domain.exception';

export class PresentacionInvalidaException extends DomainException {
  readonly code = 'PRESENTACION_INVALIDA';
  readonly httpStatus = 400;

  constructor(mensaje: string) {
    super(mensaje);
  }
}
