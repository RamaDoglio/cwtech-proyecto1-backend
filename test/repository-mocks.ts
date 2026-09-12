import { Repository, QueryBuilder, FindOptionsWhere, FindManyOptions, DeepPartial, SaveOptions, RemoveOptions } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { mocked } from 'jest-mock';

export type MockRepository<T> = {
  find: jest.Mock;
  findOne: jest.Mock;
  findOneBy: jest.Mock;
  findBy: jest.Mock;
  findAndCount: jest.Mock;
  save: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  remove: jest.Mock;
  count: jest.Mock;
  exists: jest.Mock;
  findOneOrFail: jest.Mock;
  createQueryBuilder: jest.Mock;
  manager: { transaction: jest.Mock };
  metadata: any;
  createMockEntity: (overrides?: Partial<T>) => T;
  reset: () => void;
};

export const createMockRepository = <T extends object>(entityName: string = 'Entity'): MockRepository<T> => {
  const mockRepo = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    findOneBy: jest.fn().mockResolvedValue(null),
    findBy: jest.fn().mockResolvedValue([]),
    findAndCount: jest.fn().mockResolvedValue([[], 0]),
    save: jest.fn().mockImplementation((entity: any) => Promise.resolve({ ...entity, id: entity.id || 1 })),
    create: jest.fn().mockImplementation((dto: any) => ({ ...dto, id: 1 })),
    update: jest.fn().mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] }),
    delete: jest.fn().mockResolvedValue({ affected: 1, raw: [] }),
    remove: jest.fn().mockResolvedValue({}),
    count: jest.fn().mockResolvedValue(0),
    exists: jest.fn().mockResolvedValue(false),
    findOneOrFail: jest.fn().mockRejectedValue(new Error(`${entityName} not found`)),
    createQueryBuilder: jest.fn(() => createMockQueryBuilder<T>()),
    manager: {
      transaction: jest.fn().mockImplementation(async (cb: any) => cb(mockRepo)),
    },
    metadata: {
      targetName: entityName,
      columns: [],
      relations: [],
      primaryKeys: [{ propertyName: 'id', name: 'id' }],
      ownIndices: [],
      uniques: [],
      foreignKeys: [],
      checks: [],
      discriminatorColumn: null,
      discriminatorValue: null,
      tablePath: entityName.toLowerCase(),
    },

    createMockEntity: (overrides: Partial<T> = {}) => ({ id: 1, ...overrides } as T),
    reset: () => {
      Object.values(mockRepo).forEach((fn) => {
        if (typeof fn === 'function' && fn.mockReset) {
          fn.mockReset();
        }
      });
      mockRepo.find.mockResolvedValue([]);
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.findOneBy.mockResolvedValue(null);
      mockRepo.findBy.mockResolvedValue([]);
      mockRepo.findAndCount.mockResolvedValue([[], 0]);
      mockRepo.save.mockImplementation((entity: any) => Promise.resolve({ ...entity, id: entity.id || 1 }));
      mockRepo.create.mockImplementation((dto: any) => ({ ...dto, id: 1 }));
      mockRepo.update.mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] });
      mockRepo.delete.mockResolvedValue({ affected: 1, raw: [] });
      mockRepo.count.mockResolvedValue(0);
    },
  } as MockRepository<T>;;

  return mockRepo;
};

export const createMockQueryBuilder = <T extends object>(): Partial<QueryBuilder<T>> => {
  const chainableMethods = [
    'where',
    'andWhere',
    'orWhere',
    'orderBy',
    'addOrderBy',
    'skip',
    'take',
    'innerJoin',
    'leftJoin',
    'innerJoinAndSelect',
    'leftJoinAndSelect',
    'select',
    'addSelect',
    'groupBy',
    'addGroupBy',
    'having',
    'andHaving',
    'orHaving',
  ];

  const mockQb: any = {
    getOne: jest.fn().mockResolvedValue(null),
    getMany: jest.fn().mockResolvedValue([]),
    getOneOrFail: jest.fn().mockRejectedValue(new Error('Entity not found')),
    getCount: jest.fn().mockResolvedValue(0),
    getRawOne: jest.fn().mockResolvedValue(null),
    getRawMany: jest.fn().mockResolvedValue([]),
    execute: jest.fn().mockResolvedValue({ raw: [], affected: 0 }),
  };

  for (const method of chainableMethods) {
    mockQb[method] = jest.fn().mockReturnThis();
  }

  return mockQb;
};

export const createMockDeepPartialRepository = <T extends object>(): MockRepository<T> => {
  const base = createMockRepository<T>();
  return {
    ...base,
    save: jest.fn().mockImplementation(async (entity: DeepPartial<T> | DeepPartial<T>[], options?: SaveOptions) => {
      const entities = Array.isArray(entity) ? entity : [entity];
      return entities.map((e, i) => ({ ...e, id: (e as any).id || i + 1 } as T));
    }),
    create: jest.fn().mockImplementation((dto: DeepPartial<T>) => ({ ...dto, id: 1 } as T)),
    update: jest.fn().mockImplementation(async (criteria: string | number | string[] | FindOptionsWhere<T>, partialEntity: QueryDeepPartialEntity<T>) => ({
      affected: 1,
      raw: [],
      generatedMaps: [],
    })),
  };
};

export interface MockDomainRepository<T> {
  findByIdConAuditoria: jest.Mock;
  findAll: jest.Mock;
  findOneById: jest.Mock;
  findOneBy: jest.Mock;
  findBy: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  exists: jest.Mock;
  count: jest.Mock;
}

export const createMockDomainRepository = <T extends { id: number }>(): MockDomainRepository<T> => ({
  findAll: jest.fn().mockResolvedValue([]),
  findOneById: jest.fn().mockResolvedValue(null),
  findOneBy: jest.fn().mockResolvedValue(null),
  findBy: jest.fn().mockResolvedValue([]),
  create: jest.fn().mockImplementation((dto: any) => Promise.resolve({ ...dto, id: 1 })),
  update: jest.fn().mockImplementation((id: number, dto: any) => Promise.resolve({ ...dto, id })),
  delete: jest.fn().mockResolvedValue({ affected: 1 }),
  exists: jest.fn().mockResolvedValue(false),
  count: jest.fn().mockResolvedValue(0),
  findByIdConAuditoria: jest.fn().mockResolvedValue(null)
});

export const repositoryMockFactories = {
  createMockRepository,
  createMockQueryBuilder,
  createMockDeepPartialRepository,
  createMockDomainRepository,
};