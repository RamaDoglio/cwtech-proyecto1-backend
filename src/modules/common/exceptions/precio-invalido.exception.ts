import { DomainException } from './domain.exception';

export class PrecioInvalidoException extends DomainException {
  readonly code = 'PRECIO_INVALIDO';
  readonly httpStatus = 400;

  constructor(precio: number) {
    super(`El precio nuevo debe ser mayor que 0 (recibido: ${precio})`);
  }
}
