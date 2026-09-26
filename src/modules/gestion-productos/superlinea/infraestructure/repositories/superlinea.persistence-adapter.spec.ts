import { NotFoundException } from '@nestjs/common';
import { SuperLineaPersistenceAdapter } from './superlinea.persistence-adapter';

const queryBuilder = (many: unknown[] = [], total = many.length) => {
  const query = {
    leftJoin: jest.fn(),
    addSelect: jest.fn(),
    where: jest.fn(),
    andWhere: jest.fn(),
    withDeleted: jest.fn(),
    orderBy: jest.fn(),
    skip: jest.fn(),
    take: jest.fn(),
    getMany: jest.fn().mockResolvedValue(many),
    getManyAndCount: jest.fn().mockResolvedValue([many, total]),
    getOne: jest.fn(),
    getRawOne: jest.fn(),
  };
  for (const method of ['leftJoin', 'addSelect', 'where', 'andWhere', 'withDeleted', 'orderBy', 'skip', 'take']) {
    query[method].mockReturnValue(query);
  }
  return query;
};

describe('SuperLineaPersistenceAdapter', () => {
  const repository = { createQueryBuilder: jest.fn() };
  const unitRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };
  const uow = { getRepository: jest.fn(() => unitRepository) };
  const dataSource = {
    transaction: jest.fn(),
    createQueryRunner: jest.fn(() => ({
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: { getRepository: jest.fn(() => unitRepository) },
    })),
  };
  let adapter: SuperLineaPersistenceAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new SuperLineaPersistenceAdapter(
      repository as any,
      dataSource as any,
      uow as any,
    );
  });

  it('crea, actualiza y rechaza actualizar una SuperLínea inexistente', async () => {
    const entity = { id: 1, denominacion: 'BEBIDAS' } as any;
    unitRepository.create.mockReturnValue(entity);
    unitRepository.save.mockResolvedValue(entity);
    await expect(adapter.create({ denominacion: 'BEBIDAS' } as any)).resolves.toBe(entity);

    unitRepository.findOne.mockResolvedValue(entity);
    await expect(adapter.update(1, { observacion: 'catálogo' } as any)).resolves.toBe(entity);
    expect(entity.observacion).toBe('catálogo');

    unitRepository.findOne.mockResolvedValue(null);
    await expect(adapter.update(9, {} as any)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lista, filtra y pagina SuperLíneas', async () => {
    const listQuery = queryBuilder([{ id: 1 }]);
    repository.createQueryBuilder.mockReturnValue(listQuery);
    await expect(adapter.findAllFor('beb')).resolves.toEqual([{ id: 1 }]);

    const pageQuery = queryBuilder([{ id: 1 }], 2);
    repository.createQueryBuilder.mockReturnValue(pageQuery);
    await expect(adapter.findByDenominacionFiltered('beb', 5, 10)).resolves.toEqual({
      data: [{ id: 1 }],
      total: 2,
    });
    expect(pageQuery.skip).toHaveBeenCalledWith(5);
    expect(pageQuery.take).toHaveBeenCalledWith(10);
  });

  it('encuentra por denominación incluyendo eliminadas', async () => {
    const query = queryBuilder();
    query.getOne.mockResolvedValue({ id: 2, denominacion: 'SIN CLASIFICAR' });
    repository.createQueryBuilder.mockReturnValue(query);
    await expect(adapter.findByDenominacionWith(' sin clasificar ')).resolves.toEqual({
      id: 2,
      denominacion: 'SIN CLASIFICAR',
    });
  });

  it('reasigna líneas y elimina la SuperLínea en una transacción', async () => {
    const updateQuery = {
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 3 }),
    };
    const manager = {
      createQueryBuilder: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue(updateQuery),
      }),
      save: jest.fn(),
    };
    dataSource.transaction.mockImplementation(async (callback) => callback(manager));
    const entity = { id: 5 } as any;

    await expect(adapter.removeAndReassign(entity, { id: 8 } as any, 1)).resolves.toBe(3);
    expect(updateQuery.set).toHaveBeenCalledWith({ superlineaId: 1 });
    expect(manager.save).toHaveBeenCalledWith(entity);
    expect(entity.usuarioDeletedId).toBe(8);
  });
});
