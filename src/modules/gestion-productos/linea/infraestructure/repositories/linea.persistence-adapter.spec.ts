import { NotFoundException } from '@nestjs/common';
import { LineaPersistenceAdapter } from './linea.persistence-adapter';
import { Linea } from '../../domain/entities/linea.entity';
import { EntityNotFoundException } from 'src/modules/common/exceptions/entity-notFound-exceptions';
import { DatabaseConnectionException } from 'src/modules/common/exceptions/database-connection.exception';

const queryBuilder = (many: unknown[] = [], total = many.length) => {
  const query: any = {
    leftJoin: jest.fn(),
    leftJoinAndSelect: jest.fn(),
    addSelect: jest.fn(),
    where: jest.fn(),
    andWhere: jest.fn(),
    withDeleted: jest.fn(),
    orderBy: jest.fn(),
    addOrderBy: jest.fn(),
    skip: jest.fn(),
    take: jest.fn(),
    getMany: jest.fn().mockResolvedValue(many),
    getManyAndCount: jest.fn().mockResolvedValue([many, total]),
    getOne: jest.fn(),
    getRawOne: jest.fn(),
  };
  for (const method of [
    'leftJoin',
    'leftJoinAndSelect',
    'addSelect',
    'where',
    'andWhere',
    'withDeleted',
    'orderBy',
    'addOrderBy',
    'skip',
    'take',
  ]) {
    query[method].mockReturnValue(query);
  }
  return query;
};

describe('LineaPersistenceAdapter', () => {
  const repository: any = { createQueryBuilder: jest.fn() };
  const unitRepository: any = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };
  const uow: any = { getRepository: jest.fn(() => unitRepository) };
  const dataSource: any = {
    createQueryRunner: jest.fn(() => ({
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: { getRepository: jest.fn(() => unitRepository) },
    })),
  };
  let adapter: LineaPersistenceAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new LineaPersistenceAdapter(repository, dataSource, uow);
  });

  it('crea una línea con los datos del DTO y traduce errores de persistencia', async () => {
    const entity = { id: 1 };
    unitRepository.create.mockReturnValue(entity);
    unitRepository.save.mockResolvedValue(entity);

    await expect(
      adapter.create({ denominacion: 'Bebidas', superlineaId: 2 } as any),
    ).resolves.toBe(entity);
    expect(unitRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ denominacion: 'Bebidas', superlineaId: 2 }),
    );

    unitRepository.save.mockRejectedValue(new Error('connection'));
    await expect(adapter.create({} as any)).rejects.toBeInstanceOf(
      DatabaseConnectionException,
    );
  });

  it('actualiza una línea existente y rechaza una inexistente', async () => {
    const entity = Object.assign(new Linea(), {
      id: 1,
      denominacion: 'Vieja',
      utilizaStockMinimo: false,
      stockMinimo: 5,
      superlineaId: 2,
    });
    unitRepository.findOne.mockResolvedValue(entity);
    unitRepository.save.mockResolvedValue(entity);

    await expect(
      adapter.update(1, { denominacion: 'Nueva', superlineaId: 3 } as any),
    ).resolves.toBe(entity);
    expect(entity.denominacion).toBe('Nueva');
    expect(entity.superlineaId).toBe(3);

    unitRepository.findOne.mockResolvedValue(null);
    await expect(adapter.update(9, {} as any)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('consulta una línea, lista, filtra y agrupa', async () => {
    const one = queryBuilder();
    one.getOne.mockResolvedValue({ id: 1 });
    repository.createQueryBuilder.mockReturnValue(one);
    await expect(adapter.findOne(1)).resolves.toEqual({ id: 1 });

    const filtered = queryBuilder([{ id: 1 }], 2);
    repository.createQueryBuilder.mockReturnValue(filtered);
    await expect(adapter.findByDenominacionFiltered('beb', 10, 5, false, 3)).resolves.toEqual({
      data: [{ id: 1 }],
      total: 2,
    });
    expect(filtered.andWhere).toHaveBeenCalledWith(
      'linea.superlineaId = :superlineaId',
      { superlineaId: 3 },
    );

    const grouped = queryBuilder([{ id: 2 }]);
    repository.createQueryBuilder.mockReturnValue(grouped);
    await expect(adapter.findAgrupadasPorSuperlinea(false, 4)).resolves.toEqual([
      { id: 2 },
    ]);
    expect(grouped.andWhere).toHaveBeenCalledWith(
      'linea.superlineaId = :superlineaId',
      { superlineaId: 4 },
    );
  });

  it('busca por denominación activa, incluyendo eliminadas y para selectores', async () => {
    const exact = queryBuilder();
    exact.getOne.mockResolvedValue({ id: 1 });
    repository.createQueryBuilder.mockReturnValue(exact);
    await expect(adapter.findByDenominacion('BEBIDAS')).resolves.toEqual({ id: 1 });

    const withDeleted = queryBuilder();
    withDeleted.getOne.mockResolvedValue({ id: 2 });
    repository.createQueryBuilder.mockReturnValue(withDeleted);
    await expect(adapter.findByDenominacionWith(' bebidas ')).resolves.toEqual({ id: 2 });
    expect(withDeleted.withDeleted).toHaveBeenCalled();

    const selector = queryBuilder([{ id: 3 }]);
    repository.createQueryBuilder.mockReturnValue(selector);
    await expect(adapter.findAllSinSistemaFor('')).resolves.toEqual([{ id: 3 }]);
    expect(selector.andWhere).toHaveBeenCalledWith('linea.sistema = :sistema', {
      sistema: 0,
    });
  });

  it('devuelve auditoría, permite baja lógica y propaga ausencia', async () => {
    const audit = queryBuilder();
    audit.getRawOne.mockResolvedValue({
      linea_id: 1,
      linea_denominacion: 'Bebidas',
      linea_createdAt: null,
      linea_updatedAt: null,
      linea_deletedAt: null,
      usuarioCreated_nombre: 'admin',
    });
    repository.createQueryBuilder.mockReturnValue(audit);
    await expect(adapter.findByIdConAuditoria(1)).resolves.toEqual(
      expect.objectContaining({ id: 1, detalle: 'linea Bebidas', usuarioCreated: 'admin' }),
    );

    const entity = { id: 1 } as any;
    unitRepository.save.mockResolvedValue(entity);
    await expect(adapter.remove(entity, { id: 7 } as any)).resolves.toBe(entity);
    expect(entity.usuarioDeletedId).toBe(7);

    const missing = queryBuilder();
    missing.getOne.mockResolvedValue(null);
    repository.createQueryBuilder.mockReturnValue(missing);
    await expect(adapter.findOne(8)).rejects.toBeInstanceOf(EntityNotFoundException);
  });
});
