import { HttpException, HttpStatus } from '@nestjs/common';

export class EntityConflictException extends HttpException {
  readonly code = 'CONFLICTO';

  constructor(entityName: string) {
    super(`Conflicto con la entidad ${entityName}`, HttpStatus.CONFLICT);
  }
}