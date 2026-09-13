export class StockNegativoException extends Error {
  constructor(stockResultante: number) {
    super(`El stock no puede quedar negativo (resultado: ${stockResultante})`);
    this.name = 'StockNegativoException';
  }
}