import { NotFoundException } from '@nestjs/common';
import { EnvasePresentacionPersistenceAdapter } from './envase-presentacion.persistence-adapters';

const queryBuilder = (many: unknown[] = [], total = many.length) => {
  const query = {
    leftJoin: jest.fn(),
    leftJoinAndSelect: jest.fn(),
    select: jest.fn(),
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
  for (const method of ['leftJoin', 'leftJoinAndSelect', 'select', 'where', 'andWhere', 'withDeleted', 'orderBy', 'skip', 'take']) {
    query[method].mockReturnValue(query);
  }
  return query;
};

describe('EnvasePresentacionPersistenceAdapter', () => {
  const repository = { createQueryBuilder: jest.fn(), findOne: jest.fn() };
  const unitRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOneBy: jest.fn(),
    merge: jest.fn(),
  };
  const uow = { getRepository: jest.fn(() => unitRepository) };
  const dataSource = {
    createQueryRunner: jest.fn(() => ({
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: { getRepository: jest.fn(() => unitRepository) },
    })),
  };
  let adapter: EnvasePresentacionPersistenceAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new EnvasePresentacionPersistenceAdapter(
      repository as any,
      dataSource as any,
      uow as any,
    );
  });

  it('crea y actualiza usando el repositorio de la unidad de trabajo', async () => {
    const entity = { id: 1, denominacion: 'BOTELLA' };
    unitRepository.create.mockReturnValue(entity);
    unitRepository.save.mockResolvedValue(entity);
    await expect(adapter.create({ denominacion: 'BOTELLA' } as any)).resolves.toBe(entity);
    expect(unitRepository.create).toHaveBeenCalledWith({ denominacion: 'BOTELLA' });

    unitRepository.findOneBy.mockResolvedValue(entity);
    unitRepository.save.mockResolvedValue({ ...entity, observacion: 'vidrio' });
    await expect(adapter.update(1, { observacion: 'vidrio' } as any)).resolves.toEqual({
      id: 1,
      denominacion: 'BOTELLA',
      observacion: 'vidrio',
    });
    expect(unitRepository.merge).toHaveBeenCalledWith(entity, { observacion: 'vidrio' });
  });

  it('rechaza actualizar un envase inexistente y no permite remover uno eliminado', async () => {
    unitRepository.findOneBy.mockResolvedValue(null);
    await expect(adapter.update(9, {} as any)).rejects.toBeInstanceOf(NotFoundException);

    await expect(adapter.remove({ deletedAt: new Date() } as any, { id: 2 } as any)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('consulta uno, lista, filtra y pagina envases', async () => {
    repository.findOne.mockResolvedValue({ id: 1 });
    await expect(adapter.findOne(1)).resolves.toEqual({ id: 1 });

    const listQuery = queryBuilder([{ id: 1 }]);
    repository.createQueryBuilder.mockReturnValue(listQuery);
    await expect(adapter.findAllFor('bot')).resolves.toEqual([{ id: 1 }]);
    expect(listQuery.andWhere).toHaveBeenCalledWith(
      'UPPER(envase.denominacion) LIKE :denominacion',
      { denominacion: '%BOT%' },
    );

    const pageQuery = queryBuilder([{ id: 1 }], 3);
    repository.createQueryBuilder.mockReturnValue(pageQuery);
    await expect(adapter.findBy('bot', 10, 5, false)).resolves.toEqual({
      data: [{ id: 1 }],
      total: 3,
    });
    expect(pageQuery.skip).toHaveBeenCalledWith(10);
    expect(pageQuery.take).toHaveBeenCalledWith(5);
  });

  it('busca denominaciones incluyendo eliminadas y arma auditoría', async () => {
    const nameQuery = queryBuilder();
    nameQuery.getOne.mockResolvedValue({ id: 4, denominacion: 'BOTELLA' });
    repository.createQueryBuilder.mockReturnValue(nameQuery);
    await expect(adapter.findByDenominacionWith(' botella ')).resolves.toEqual({
      id: 4,
      denominacion: 'BOTELLA',
    });

    const auditQuery = queryBuilder();
    auditQuery.getRawOne.mockResolvedValue({
      id: 4,
      denominacion: 'BOTELLA',
      createdAt: null,
      updatedAt: null,
      deletedAt: null,
      usuarioCreated: 'admin',
    });
    repository.createQueryBuilder.mockReturnValue(auditQuery);
    await expect(adapter.findByIdConAuditoria(4)).resolves.toEqual({
      id: 4,
      detalle: 'Envase de presentación BOTELLA',
      createdAt: '',
      updatedAt: '',
      deletedAt: '',
      usuarioCreated: 'admin',
      usuarioUpdated: '',
      usuarioDeleted: '',
    });
  });

  it('hace soft delete y conserva el usuario auditor', async () => {
    const entity = { id: 4 } as any;
    unitRepository.save.mockResolvedValue(entity);
    await expect(adapter.remove(entity, { id: 8 } as any)).resolves.toBe(entity);
    expect(entity.usuarioDeletedId).toBe(8);
    expect(unitRepository.save).toHaveBeenCalledWith(entity);
  });
});
