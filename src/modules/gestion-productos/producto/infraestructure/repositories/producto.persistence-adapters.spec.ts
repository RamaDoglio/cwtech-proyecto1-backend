import { NotFoundException } from '@nestjs/common';
import { Producto } from '../../domain/entities/producto.entity';
import { Usuario } from 'src/modules/gestion-usuario/usuario/domain/entities/usuario.entity';
import { ProductoPersistenceAdapter } from './producto.persistence-adapters';
import { DatabaseConnectionException } from 'src/modules/common/exceptions/database-connection.exception';
import { EntityNotFoundException } from 'src/modules/common/exceptions/entity-notFound-exceptions';
import { NotFoundException } from '@nestjs/common';

const createQueryBuilderMock = (result: [unknown[], number]) => {
  const query = {
    leftJoinAndSelect: jest.fn(),
    where: jest.fn(),
    andWhere: jest.fn(),
    limit: jest.fn(),
    orderBy: jest.fn(),
    skip: jest.fn(),
    take: jest.fn(),
    getManyAndCount: jest.fn().mockResolvedValue(result),
    getMany: jest.fn().mockResolvedValue(result[0]),
    getOne: jest.fn(),
    getCount: jest.fn(),
    getExists: jest.fn(),
  };

  query.leftJoinAndSelect.mockReturnValue(query);
  query.where.mockReturnValue(query);
  query.andWhere.mockReturnValue(query);
  query.limit.mockReturnValue(query);
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
    ['denominación', 'leche', 'UPPER(producto.denominacion) LIKE UPPER(:denominacion)', { denominacion: '%leche%' }],
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
      'UPPER(producto.denominacion) LIKE UPPER(:denominacion)',
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
      'UPPER(producto.denominacion) LIKE UPPER(:denominacion)',
    );
    expect(query.andWhere.mock.calls[1][0]).toBe(
      'UPPER(linea.denominacion) LIKE UPPER(:linea)',
    );
    expect(query.andWhere.mock.calls[2][0]).toBe(
      'UPPER(superlinea.denominacion) LIKE UPPER(:superlinea)',
    );
  });

  it.each([
    ['excluye los eliminados por defecto', undefined, true],
    ['excluye los eliminados con incluirEliminados=false', false, true],
    ['incluye los eliminados con incluirEliminados=true', true, false],
  ])('%s', async (_caso, incluirEliminados, filtraEliminados) => {
    const query = createQueryBuilderMock([[], 0]);
    repository.createQueryBuilder.mockReturnValue(query);

    await adapter.findBy('', '', '', '', false, '', 0, 0, 0, false, 0, 10, incluirEliminados);

    const condiciones = query.andWhere.mock.calls.map(([condicion]) => condicion);
    expect(condiciones.includes('producto.deletedAt IS NULL')).toBe(filtraEliminados);
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

  it('aplica todos los filtros de catálogo, stock, orden y paginación', async () => {
    const query = createQueryBuilderMock([[{ id: 4 }], 1]);
    repository.createQueryBuilder.mockReturnValue(query);

    await adapter.findBy(
      'leche',
      'lacteos',
      'almacen',
      'PROV-1',
      true,
      'REF-1',
      2,
      3,
      4,
      true,
      20,
      10,
    );

    expect(query.andWhere).toHaveBeenCalledWith(
      'UPPER(producto.codigoProveedor) = UPPER(:codigoProveedor)',
      { codigoProveedor: 'PROV-1' },
    );
    expect(query.andWhere).toHaveBeenCalledWith(
      'UPPER(producto.codigoReferencia) LIKE UPPER(:codigoReferencia)',
      { codigoReferencia: '%REF-1%' },
    );
    expect(query.andWhere).toHaveBeenCalledWith('marca.id = :marca_id', { marca_id: 2 });
    expect(query.andWhere).toHaveBeenCalledWith('linea.id = :linea_id', { linea_id: 3 });
    expect(query.andWhere).toHaveBeenCalledWith('proveedor.id = :proveedor_id', { proveedor_id: 4 });
    expect(query.andWhere).toHaveBeenCalledWith('producto.stock > 0');
    expect(query.andWhere).toHaveBeenCalledWith('producto.deletedAt IS NULL');
    expect(query.orderBy).toHaveBeenCalledWith('producto.denominacion', 'ASC');
    expect(query.skip).toHaveBeenCalledWith(20);
    expect(query.take).toHaveBeenCalledWith(10);
  });

  it('busca rápidamente por códigos exactos o parciales y pagina', async () => {
    const query = createQueryBuilderMock([[{ id: 4 }], 1]);
    repository.createQueryBuilder.mockReturnValue(query);

    await adapter.findByRapido('ABC', true, 5, 15);

    expect(query.where).toHaveBeenCalledWith('producto.deletedAt IS NULL');
    expect(query.andWhere).toHaveBeenCalledWith(
      '(producto.codigoProveedor = :codigo OR producto.codigoReferencia = :codigo)',
      { codigo: 'ABC' },
    );
    expect(query.skip).toHaveBeenCalledWith(5);
    expect(query.take).toHaveBeenCalledWith(15);
  });

  it('deduplica IDs antes de consultar productos', async () => {
    const query = createQueryBuilderMock([[{ id: 1 }], 1]);
    repository.createQueryBuilder.mockReturnValue(query);

    await adapter.findByIds([1, 1, 2, 2]);

    expect(query.where).toHaveBeenCalledWith('producto.id IN (:...ids)', {
      ids: [1, 2],
    });
  });

  it('devuelve false para un código de proveedor vacío sin consultar', async () => {
    await expect(adapter.isCodigoProveedorDuplicado('  ')).resolves.toBe(false);
    expect(repository.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('consulta existencia de productos activos por Marca', async () => {
    const query = createQueryBuilderMock([[{ id: 1 }], 1]);
    query.getCount.mockResolvedValue(1);
    repository.createQueryBuilder.mockReturnValue(query);

    await expect(adapter.existsProductosActivosByMarca(8)).resolves.toBe(true);
    expect(query.where).toHaveBeenCalledWith('producto.marca_id = :marcaId', {
      marcaId: 8,
    });
    expect(query.andWhere).toHaveBeenCalledWith('producto.deletedAt IS NULL');
    expect(query.limit).toHaveBeenCalledWith(1);
  });
});

describe('ProductoPersistenceAdapter.persistencia y consultas', () => {
  const repository = {
    createQueryBuilder: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };
  let adapter: ProductoPersistenceAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new ProductoPersistenceAdapter(repository as any, {} as any, {} as any);
  });

  it('envuelve un error de save en DatabaseConnectionException', async () => {
    repository.save.mockRejectedValue(new Error('connection'));

    await expect(adapter.save({} as any)).rejects.toBeInstanceOf(
      DatabaseConnectionException,
    );
  });

  it('no permite remover un producto ya eliminado', async () => {
    await expect(adapter.remove({ deletedAt: new Date() } as any)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('propaga EntityNotFoundException al buscar un producto inexistente', async () => {
    const query = createQueryBuilderMock([[], 0]);
    query.getOne.mockResolvedValue(null);
    repository.createQueryBuilder.mockReturnValue(query);

    await expect(adapter.findOne(99)).rejects.toBeInstanceOf(
      EntityNotFoundException,
    );
  });
});

describe('ProductoPersistenceAdapter.findByRapido', () => {
  const repository = { createQueryBuilder: jest.fn() };
  let adapter: ProductoPersistenceAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new ProductoPersistenceAdapter(repository as any, {} as any, {} as any);
  });

  it.each([
    ['excluye los eliminados por defecto', undefined, true],
    ['incluye los eliminados con incluirEliminados=true', true, false],
  ])('%s', async (_caso, incluirEliminados, filtraEliminados) => {
    const query = createQueryBuilderMock([[], 0]);
    repository.createQueryBuilder.mockReturnValue(query);

    await adapter.findByRapido('ACE', false, 0, 10, incluirEliminados);

    const condiciones = query.andWhere.mock.calls.map(([condicion]) => condicion);
    expect(condiciones.includes('producto.deletedAt IS NULL')).toBe(filtraEliminados);
    expect(condiciones).toContain(
      '(producto.codigoProveedor LIKE :codigo OR producto.codigoReferencia LIKE :codigo)',
    );
  });
});

describe('ProductoPersistenceAdapter.remove (soft delete)', () => {
  const repository = { save: jest.fn() };
  const usuario = { id: 4, denominacion: 'Jenifer Lopez' } as Usuario;
  let adapter: ProductoPersistenceAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    repository.save.mockImplementation(async (producto) => producto);
    adapter = new ProductoPersistenceAdapter(repository as any, {} as any, {} as any);
  });

  it('marca la baja con fecha y usuario y la persiste, sin borrar la fila', async () => {
    const producto = Object.assign(new Producto(), { id: 7, deletedAt: null });

    const resultado = await adapter.remove(producto, usuario);

    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 7,
        deletedAt: expect.any(Date),
        usuarioDeleted: usuario,
      }),
    );
    expect(resultado.deletedAt).toBeInstanceOf(Date);
  });

  it('rechaza un producto ya eliminado sin volver a guardarlo', async () => {
    const producto = Object.assign(new Producto(), {
      id: 7,
      deletedAt: new Date('2026-09-20T10:00:00Z'),
    });

    await expect(adapter.remove(producto, usuario)).rejects.toThrow(
      NotFoundException,
    );
    expect(repository.save).not.toHaveBeenCalled();
  });
});
