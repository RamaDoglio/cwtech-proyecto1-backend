/**
 * Base común para excepciones de dominio.
 * Cada subclase declara `code` (máquina-legible, estable para el frontend)
 * y `httpStatus` (código HTTP semántico). El GlobalExceptionFilter los usa
 * para resolver la respuesta sin cadenas de instanceof por excepción.
 */
export abstract class DomainException extends Error {
  abstract readonly code: string;
  abstract readonly httpStatus: number;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}