import { DomainException } from './domain.exception';

export class PresentacionRequeridaException extends DomainException {
  readonly code = 'PRESENTACION_REQUERIDA';
  readonly httpStatus = 400;

  constructor() {
    super('La presentación es obligatoria.');
  }
}
