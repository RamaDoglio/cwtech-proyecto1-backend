import { ProductoPersistenceAdapter } from './producto.persistence-adapters';

const createQueryBuilderMock = (result: [unknown[], number]) => {
  const query = {
    leftJoinAndSelect: jest.fn(),
    andWhere: jest.fn(),
    orderBy: jest.fn(),
    skip: jest.fn(),
    take: jest.fn(),
    getManyAndCount: jest.fn().mockResolvedValue(result),
  };

  query.leftJoinAndSelect.mockReturnValue(query);
  query.andWhere.mockReturnValue(query);
  query.orderBy.mockReturnValue(query);
  query.skip.mockReturnValue(query);
  query.take.mockReturnValue(query);

  return query;
};

describe('ProductoPersistenceAdapter.findBy', () => {
  const repository = { createQueryBuilder: jest.fn() };
  const dataSource = {};
  const unitOfWork = {};
  let adapter: ProductoPersistenceAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new ProductoPersistenceAdapter(
      repository as any,
      dataSource as any,
      unitOfWork as any,
    );
  });

  it.each([
    ['denominación', 'leche', '(UPPER(producto.denominacion) LIKE UPPER(:denominacion))', { denominacion: '%leche%' }],
    ['línea', 'lacte', 'UPPER(linea.denominacion) LIKE UPPER(:linea)', { linea: '%lacte%' }],
    ['SuperLínea', 'bebid', 'UPPER(superlinea.denominacion) LIKE UPPER(:superlinea)', { superlinea: '%bebid%' }],
  ])('aplica coincidencia parcial por %s', async (_criterio, valor, condicion, parametros) => {
    const query = createQueryBuilderMock([[{ id: 1 }], 1]);
    repository.createQueryBuilder.mockReturnValue(query);

    const result = await adapter.findBy(
      _criterio === 'denominación' ? valor : '',
      _criterio === 'línea' ? valor : '',
      _criterio === 'SuperLínea' ? valor : '',
      '',
      false,
      '',
      0,
      0,
      0,
      false,
      0,
      10,
    );

    expect(query.andWhere).toHaveBeenCalledWith(condicion, parametros);
    expect(result).toEqual({ data: [{ id: 1 }], total: 1 });
  });

  it('combina denominación, Línea y SuperLínea con filtros restrictivos', async () => {
    const query = createQueryBuilderMock([[{ id: 2 }], 1]);
    repository.createQueryBuilder.mockReturnValue(query);

    await adapter.findBy(
      'leche',
      'lacte',
      'bebid',
      '',
      false,
      '',
      0,
      0,
      0,
      false,
      0,
      10,
    );

    expect(query.andWhere).toHaveBeenCalledWith(
      '(UPPER(producto.denominacion) LIKE UPPER(:denominacion))',
      { denominacion: '%leche%' },
    );
    expect(query.andWhere).toHaveBeenCalledWith(
      'UPPER(linea.denominacion) LIKE UPPER(:linea)',
      { linea: '%lacte%' },
    );
    expect(query.andWhere).toHaveBeenCalledWith(
      'UPPER(superlinea.denominacion) LIKE UPPER(:superlinea)',
      { superlinea: '%bebid%' },
    );
    expect(query.andWhere.mock.calls[0][0]).toBe(
      '(UPPER(producto.denominacion) LIKE UPPER(:denominacion))',
    );
    expect(query.andWhere.mock.calls[1][0]).toBe(
      'UPPER(linea.denominacion) LIKE UPPER(:linea)',
    );
    expect(query.andWhere.mock.calls[2][0]).toBe(
      'UPPER(superlinea.denominacion) LIKE UPPER(:superlinea)',
    );
  });

  it('devuelve data vacía y total cero cuando no hay coincidencias', async () => {
    const query = createQueryBuilderMock([[], 0]);
    repository.createQueryBuilder.mockReturnValue(query);

    await expect(
      adapter.findBy(
        'inexistente',
        'lacte',
        'bebid',
        '',
        false,
        '',
        0,
        0,
        0,
        false,
        0,
        10,
      ),
    ).resolves.toEqual({ data: [], total: 0 });
  });
});
