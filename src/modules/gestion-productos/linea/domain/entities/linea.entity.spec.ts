import { getMetadataArgsStorage } from 'typeorm';

import { Linea } from './linea.entity';
import { SuperLinea } from '../../../superlinea/domain/entities/superlinea.entity';

describe('Linea', () => {
  it('requiere una única SuperLínea mediante una relación many-to-one', () => {
    const metadata = getMetadataArgsStorage();
    const relacion = metadata.relations.find(
      (relation) =>
        relation.target === Linea && relation.propertyName === 'superlinea',
    );
    const columna = metadata.columns.find(
      (column) =>
        column.target === Linea && column.propertyName === 'superlineaId',
    );

    expect(relacion?.relationType).toBe('many-to-one');
    expect((relacion?.type as () => unknown)()).toBe(SuperLinea);
    expect(columna?.options.name).toBe('superlinea_id');
    expect(columna?.options.nullable).not.toBe(true);
  });
});
