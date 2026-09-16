import { HttpException, HttpStatus } from '@nestjs/common';

export class EntityNotFoundException extends HttpException {
  readonly code = 'NO_ENCONTRADO';

  constructor(entityName: string) {
    super(`${entityName}, no existe o fue eliminada`, HttpStatus.NOT_FOUND);
  }
}