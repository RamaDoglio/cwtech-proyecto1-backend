import { EnvasePresentacion } from '../domain/entities/envase-presentacion.entity';
import { EnvasePresentacionDto } from '../dto/envase-presentacion.dto';

export class EnvasePresentacionMapper {
  static toDto(entity: EnvasePresentacion): EnvasePresentacionDto {
    return {
      id: entity.id,
      denominacion: entity.denominacion,
      observacion: entity.observacion ?? '',
      sistema: entity.sistema,
      deletedAt: entity.deletedAt ? entity.deletedAt.toISOString() : null,
    };
  }
}
