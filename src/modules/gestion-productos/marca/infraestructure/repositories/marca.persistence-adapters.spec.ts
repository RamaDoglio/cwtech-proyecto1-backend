import { NotFoundException } from '@nestjs/common';
import { MarcaPersistenceAdapter } from './marca.persistence-adapters';
import { DatabaseConnectionException } from 'src/modules/common/exceptions/database-connection.exception';
import { EntityNotFoundException } from 'src/modules/common/exceptions/entity-notFound-exceptions';

const queryBuilder = (many: unknown[] = [], total = many.length) => {
  const query: any = {
    where: jest.fn(), andWhere: jest.fn(), withDeleted: jest.fn(),
    orderBy: jest.fn(), skip: jest.fn(), take: jest.fn(), leftJoin: jest.fn(),
    addSelect: jest.fn(), getMany: jest.fn().mockResolvedValue(many),
    getManyAndCount: jest.fn().mockResolvedValue([many, total]),
    getOne: jest.fn(), getRawOne: jest.fn(),
  };
  for (const method of ['where', 'andWhere', 'withDeleted', 'orderBy', 'skip', 'take', 'leftJoin', 'addSelect']) {
    query[method].mockReturnValue(query);
  }
  return query;
};

describe('MarcaPersistenceAdapter', () => {
  const repository: any = { createQueryBuilder: jest.fn(), findOne: jest.fn() };
  const unitRepository: any = {
    create: jest.fn(), save: jest.fn(), findOneBy: jest.fn(), merge: jest.fn(),
  };
  const uow: any = { getRepository: jest.fn(() => unitRepository) };
  const dataSource: any = {
    createQueryRunner: jest.fn(() => ({
      connect: jest.fn(), startTransaction: jest.fn(), commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(), release: jest.fn(),
      manager: { getRepository: jest.fn(() => unitRepository) },
    })),
  };
  let adapter: MarcaPersistenceAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new MarcaPersistenceAdapter(repository, dataSource, uow);
  });

  it('crea, actualiza y da de baja una marca', async () => {
    const entity: any = { id: 1, denominacion: 'ACME' };
    unitRepository.create.mockReturnValue(entity);
    unitRepository.save.mockResolvedValue(entity);
    await expect(adapter.create({ denominacion: 'ACME' } as any)).resolves.toBe(entity);

    unitRepository.findOneBy.mockResolvedValue(entity);
    await expect(adapter.update(1, { denominacion: 'NUEVA' })).resolves.toBe(entity);
    expect(unitRepository.merge).toHaveBeenCalledWith(entity, { denominacion: 'NUEVA' });

    await expect(adapter.remove(entity as any, { id: 8 } as any)).resolves.toBe(entity);
    expect(entity.usuarioDeletedId).toBe(8);
    await expect(adapter.remove({ deletedAt: new Date() } as any, { id: 8 } as any)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('consulta por id, denominación y listados con filtros', async () => {
    repository.findOne.mockResolvedValue({ id: 1 });
    await expect(adapter.findOne(1)).resolves.toEqual({ id: 1 });
    repository.findOne.mockResolvedValue(null);
    await expect(adapter.findOne(9)).rejects.toBeInstanceOf(EntityNotFoundException);

    const query = queryBuilder([{ id: 1 }], 3);
    repository.createQueryBuilder.mockReturnValue(query);
    await expect(adapter.findBy('ac', 10, 5, false)).resolves.toEqual({ data: [{ id: 1 }], total: 3 });
    expect(query.skip).toHaveBeenCalledWith(10);
    expect(query.take).toHaveBeenCalledWith(5);

    const sistema = queryBuilder([{ id: 2 }]);
    repository.createQueryBuilder.mockReturnValue(sistema);
    await expect(adapter.findAllSistemaFor('sys')).resolves.toEqual([{ id: 2 }]);
    await expect(adapter.findAllSinSistemaFor('user')).resolves.toEqual([{ id: 2 }]);
  });

  it('resuelve búsquedas auxiliares, auditoría y errores de conexión', async () => {
    repository.findOne.mockRejectedValue(new Error('connection'));
    await expect(adapter.findByDenominacion('ACME')).rejects.toBeInstanceOf(DatabaseConnectionException);

    const withDeleted = queryBuilder();
    withDeleted.getOne.mockResolvedValue({ id: 2, denominacion: 'ACME' });
    repository.createQueryBuilder.mockReturnValue(withDeleted);
    await expect(adapter.findByDenominacionWith(' acme ')).resolves.toEqual({ id: 2, denominacion: 'ACME' });

    const audit = queryBuilder();
    audit.getRawOne.mockResolvedValue({ marca_id: 1, marca_denominacion: 'ACME' });
    repository.createQueryBuilder.mockReturnValue(audit);
    await expect(adapter.findByIdConAuditoria(1)).resolves.toEqual(expect.objectContaining({ id: 1, detalle: 'Marca ACME' }));
  });
});
