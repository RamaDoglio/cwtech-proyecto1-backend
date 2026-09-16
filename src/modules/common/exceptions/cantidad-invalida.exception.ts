import { DomainException } from './domain.exception';

export class CantidadInvalidaException extends DomainException {
  readonly code = 'CANTIDAD_INVALIDA';
  readonly httpStatus = 400;

  constructor(cantidad: number) {
    super(`La cantidad no puede ser 0 (recibido: ${cantidad})`);
  }
}