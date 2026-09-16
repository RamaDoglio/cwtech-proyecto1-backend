import { DomainException } from './domain.exception';

export class StockNegativoException extends DomainException {
  readonly code = 'STOCK_NEGATIVO';
  readonly httpStatus = 409;

  constructor(
    public readonly resultado: number,
    public readonly stockActual?: number,
    public readonly cantidad?: number,
  ) {
    super(
      stockActual !== undefined && cantidad !== undefined
        ? `El ajuste dejaría el stock en ${resultado} ` +
          `(stock actual: ${stockActual}, ajuste: ${cantidad}). ` +
          `El stock no puede quedar negativo.`
        : `El stock no puede quedar negativo (resultado: ${resultado})`,
    );
  }
}