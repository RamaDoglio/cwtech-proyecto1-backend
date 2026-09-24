import { Test, TestingModule } from '@nestjs/testing';
import { ProductoService } from './producto.service';
import { IProductoRepository } from '../../domain/interfaces/producto.repository-interface';
import { LineaService } from '../../../linea/application/services/linea.service';
import { MarcaService } from '../../../marca/application/services/marca.service';
import { ProveedorService } from '../../../../organizacion/proveedor/application/services/proveedor.service';
import { UsuarioService } from '../../../../gestion-usuario/usuario/application/services/usuario.service';
import { ProductoIntrinsicValidationService } from '../../domain/services/producto-intrinsic-validation.service';
import { ProductoValidationService } from '../../domain/services/producto-validation.service';
import { ProductoRelatedEntitiesValidator } from '../../infraestructure/validators/producto-related-entities.validator';
import { ProductoUniquenessValidator } from '../../infraestructure/validators/producto-uniqueness.validator';
import { UsuarioValidator } from '../../../../common/utils/validation/usuario-validator';
import { ProductoDeletePolicy } from '../policies/producto-delete.policy';
import { CreateProductoDto } from '../../dto/create-producto.dto';
import { UpdateProductoDto } from '../../dto/update-producto.dto';
import { DataSource } from 'typeorm';
import { Producto } from '../../domain/entities/producto.entity';
import { MovimientoStock } from '../../domain/entities/movimiento-stock.entity';
import { HistorialPrecio } from '../../domain/entities/historial-precio.entity';
import { PrecioInvalidoException } from '../../../../common/exceptions/precio-invalido.exception';
import { PresentacionInvalidaException } from '../../../../common/exceptions/presentacion-invalida.exception';
import { PresentacionRequeridaException } from '../../../../common/exceptions/presentacion-requerida.exception';
import { CambioPreciosMasivoHistorial } from '../../domain/entities/cambio-precio-masivo-historial.entity';
import { CambioPreciosMasivoDto } from '../../dto/cambio-precios-masivo.dto';
import { AlcanceAjustePrecio } from '../../enums/alcance-ajuste-precio.enum';
import { TipoAumento } from '../../../../common/enums/tipo-aumento.emun';
import { NotFoundException } from '@nestjs/common';
import { EnvasePresentacion } from '../../../envase-presentacion/domain/entities/envase-presentacion.entity';

// ==================== MOCKS ====================
// Cada dependencia debe tener al menos los métodos que el servicio invoca.

const mockRepository = {
  create: jest.fn(),
  update: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  findByRapido: jest.fn(),
  findBy: jest.fn(),
  findByIdConAuditoria: jest.fn(),
  remove: jest.fn(),
  findByDenominacionCodigoProveedorFiltered: jest.fn(),
  existsProductosActivosByMarca: jest.fn(),
  existsProductosActivosByLinea: jest.fn(),
  findByIds: jest.fn(),
  updateEntity: jest.fn(),
};

const mockLineaService = {
  findEntityById: jest.fn(),
  findAllFor: jest.fn(),
};

const mockMarcaService = {
  findEntityById: jest.fn(),
  findAllFor: jest.fn(),
};

const mockProveedorService = {}; // si no se usa, vacío

const mockUsuarioService = {
  findOne: jest.fn(),
};

const mockIntrinsicValidationService = {
  validarDatosBasicos: jest.fn(),
};

const mockValidationService = {
  validarEntidadesRelacionadas: jest.fn(),
};

const mockRelatedEntitiesValidator = {
  validarYObtenerEntidadesRelacionadas: jest.fn(),
  validarYObtenerEnvasePresentacion: jest.fn(),
};

const mockUniquenessValidator = {
  validarDenominacionUnica: jest.fn(),
  validarCodigoProveedorUnico: jest.fn(),
};

const mockUsuarioValidator = {
  validarUsuarioExiste: jest.fn(),
};

const mockProductoDeletePolicy = {};
const mockEntityManager = {
  findOne: jest.fn(),
  update: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  createQueryBuilder: jest.fn(),
};
const mockDataSource = {
  transaction: jest.fn(),
  getRepository: jest.fn(),
};
describe('ProductoService', () => {
  let service: ProductoService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductoService,
        { provide: 'IProductoRepository', useValue: mockRepository },
        { provide: LineaService, useValue: mockLineaService },
        { provide: MarcaService, useValue: mockMarcaService },
        { provide: ProveedorService, useValue: mockProveedorService },
        { provide: UsuarioService, useValue: mockUsuarioService },
        {
          provide: ProductoIntrinsicValidationService,
          useValue: mockIntrinsicValidationService,
        },
        { provide: ProductoValidationService, useValue: mockValidationService },
        {
          provide: ProductoRelatedEntitiesValidator,
          useValue: mockRelatedEntitiesValidator,
        },
        {
          provide: ProductoUniquenessValidator,
          useValue: mockUniquenessValidator,
        },
        { provide: UsuarioValidator, useValue: mockUsuarioValidator },
        { provide: ProductoDeletePolicy, useValue: mockProductoDeletePolicy },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<ProductoService>(ProductoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('combina filtros parciales y conserva una respuesta vacía cuando no hay coincidencias', async () => {
    mockRepository.findBy.mockResolvedValue({ data: [], total: 0 });

    await expect(
      service.findBy(
        'inexistente',
        'lacteos',
        'bebidas',
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

    expect(mockRepository.findBy).toHaveBeenCalledWith(
      'inexistente',
      'lacteos',
      'bebidas',
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
  });

  it('revierte el ajuste completo si falla la persistencia del movimiento', async () => {
    const producto = Object.assign(new Producto(), {
      id: 1,
      stock: 10,
      movimientos: [],
    });
    const error = new Error('No se pudo guardar el movimiento');
    mockEntityManager.findOne.mockResolvedValue(producto);
    mockEntityManager.update.mockResolvedValue({ affected: 1 });
    mockEntityManager.save.mockRejectedValueOnce(error);
    mockDataSource.transaction.mockImplementation(async (callback) =>
      callback(mockEntityManager),
    );

    await expect(service.incrementarStock(1, 5)).rejects.toThrow(error);

    expect(mockDataSource.transaction).toHaveBeenCalledTimes(1);
    expect(mockEntityManager.update).toHaveBeenCalledWith(Producto, 1, {
      stock: 15,
    });
    expect(mockEntityManager.save).toHaveBeenCalledWith(
      MovimientoStock,
      expect.objectContaining({ productoId: 1, cantidad: 5 }),
    );
  });

  it('bloquea la fila del producto en cada ajuste concurrente', async () => {
    mockDataSource.transaction.mockImplementation(async (callback) => {
      const producto = Object.assign(new Producto(), {
        id: 1,
        stock: 10,
        movimientos: [],
      });
      mockEntityManager.findOne.mockResolvedValueOnce(producto);
      mockEntityManager.update.mockResolvedValue({ affected: 1 });
      mockEntityManager.save.mockResolvedValue(producto);
      return callback(mockEntityManager);
    });

    await Promise.all([
      service.incrementarStock(1, 2),
      service.decrementarStock(1, 1),
    ]);

    expect(mockDataSource.transaction).toHaveBeenCalledTimes(2);
    expect(mockEntityManager.findOne).toHaveBeenCalledWith(Producto, {
      where: { id: 1 },
      lock: { mode: 'pessimistic_write' },
    });
  });

  it('resuelve costo, margen y precio antes de crear el producto', async () => {
    mockRelatedEntitiesValidator.validarYObtenerEntidadesRelacionadas.mockResolvedValue(
      {
        marca: { id: 1 },
        linea: { id: 1 },
      },
    );
    mockRelatedEntitiesValidator.validarYObtenerEnvasePresentacion.mockResolvedValue(
      Object.assign(new EnvasePresentacion(), { id: 1, denominacion: 'BOTELLA' }),
    );
    mockUsuarioValidator.validarUsuarioExiste.mockResolvedValue({ id: 1 });
    mockRepository.save.mockImplementation(async (producto) => producto);

    await service.create({
      denominacion: 'producto',
      costo: 100,
      utilizaStockMinimo: false,
      utilizaPack: false,
      lineaId: 1,
      marcaId: 1,
      alicuotaIva: 21,
      usuarioCreatedId: 1,
      // El alta exige presentación desde CR-002 (PA-023 §5).
      presentacion: { envaseId: 1, cantidad: 500, unidad: 'ml' },
    } as CreateProductoDto);

    expect(mockRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ costo: 100, porcentaje: 15, precio: 115 }),
    );
  });

  describe('update — historial de precios', () => {
    const prepararEdicion = () => {
      mockRepository.findOne.mockResolvedValue(
        Object.assign(new Producto(), {
          id: 1,
          denominacion: 'producto',
          costo: 100,
          porcentaje: 15,
          precio: 115,
          linea: { id: 1 },
          marca: { id: 1 },
          alicuotaIva: 21,
        }),
      );
      mockRelatedEntitiesValidator.validarYObtenerEntidadesRelacionadas.mockResolvedValue(
        {
          marca: { id: 1 },
          linea: { id: 1 },
        },
      );
      mockUsuarioValidator.validarUsuarioExiste.mockResolvedValue({ id: 1 });
      mockRepository.save.mockImplementation(async (producto) => producto);
      mockEntityManager.save.mockImplementation(
        async (_target, entity) => entity,
      );
      mockDataSource.transaction.mockImplementation(async (callback) =>
        callback(mockEntityManager),
      );
    };

    it('recalcula el precio y registra el cambio en el historial en una única transacción', async () => {
      prepararEdicion();

      await service.update(1, {
        denominacion: 'producto',
        costo: 200,
        margen: 0,
        usuarioUpdatedId: 1,
      } as UpdateProductoDto);

      expect(mockDataSource.transaction).toHaveBeenCalledTimes(1);
      expect(mockEntityManager.save).toHaveBeenCalledWith(
        Producto,
        expect.objectContaining({ costo: 200, porcentaje: 0, precio: 200 }),
      );
      expect(mockEntityManager.save).toHaveBeenCalledWith(
        HistorialPrecio,
        expect.objectContaining({
          productoId: 1,
          precioAnterior: 115,
          precioNuevo: 200,
          motivo:
            'Edición del producto: precio recalculado según costo y margen',
          usuarioId: 1,
        }),
      );
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('no registra historial si la edición no cambia el precio', async () => {
      prepararEdicion();

      await service.update(1, {
        denominacion: 'producto renombrado',
        usuarioUpdatedId: 1,
      } as UpdateProductoDto);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          denominacion: 'producto renombrado',
          precio: 115,
        }),
      );
      expect(mockDataSource.transaction).not.toHaveBeenCalled();
      expect(mockEntityManager.save).not.toHaveBeenCalled();
    });

    it('rechaza una edición que deja el precio en 0 sin persistir nada', async () => {
      prepararEdicion();

      await expect(
        service.update(1, {
          costo: 0,
          usuarioUpdatedId: 1,
        } as UpdateProductoDto),
      ).rejects.toThrow(PrecioInvalidoException);

      expect(mockRepository.save).not.toHaveBeenCalled();
      expect(mockDataSource.transaction).not.toHaveBeenCalled();
    });
  });

  describe('aplicarCambioMasivo', () => {
    const prepararAjuste = (productos: Producto[]) => {
      const queryBuilder = {
        setLock: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(productos),
      };
      mockUsuarioValidator.validarUsuarioExiste.mockResolvedValue({ id: 1 });
      mockEntityManager.createQueryBuilder.mockReturnValue(queryBuilder);
      mockEntityManager.update.mockResolvedValue({ affected: 1 });
      mockEntityManager.save.mockImplementation(
        async (_target, entity) => entity,
      );
      mockEntityManager.create.mockImplementation((_target, data) => data);
      mockDataSource.transaction.mockImplementation(async (callback) =>
        callback(mockEntityManager),
      );
      return queryBuilder;
    };

    const producto = (id: number, precio: number) =>
      Object.assign(new Producto(), {
        id,
        denominacion: `producto ${id}`,
        precio,
        historialPrecios: [],
      });

    it('cambia los precios y registra un historial por producto en una única transacción', async () => {
      const queryBuilder = prepararAjuste([producto(1, 100), producto(2, 200)]);

      const resultado = await service.aplicarCambioMasivo({
        tipo: TipoAumento.PORCENTAJE,
        valor: 10,
        alcance: AlcanceAjustePrecio.GLOBAL,
        usuarioId: 1,
      } as CambioPreciosMasivoDto);

      expect(mockDataSource.transaction).toHaveBeenCalledTimes(1);
      expect(queryBuilder.setLock).toHaveBeenCalledWith('pessimistic_write');
      expect(queryBuilder.andWhere).not.toHaveBeenCalled();
      expect(mockEntityManager.update).toHaveBeenCalledWith(Producto, 1, {
        precio: 110,
      });
      expect(mockEntityManager.update).toHaveBeenCalledWith(Producto, 2, {
        precio: 220,
      });
      expect(mockEntityManager.save).toHaveBeenCalledWith(
        HistorialPrecio,
        expect.objectContaining({
          productoId: 1,
          precioAnterior: 100,
          precioNuevo: 110,
          motivo: 'Ajuste masivo +10 % (todos los productos)',
          usuarioId: 1,
        }),
      );
      expect(mockEntityManager.save).toHaveBeenCalledWith(
        HistorialPrecio,
        expect.objectContaining({
          productoId: 2,
          precioAnterior: 200,
          precioNuevo: 220,
        }),
      );
      expect(mockEntityManager.save).toHaveBeenCalledWith(
        CambioPreciosMasivoHistorial,
        expect.objectContaining({ cantidadProductosAfectados: 2 }),
      );
      expect(resultado).toEqual({
        message: 'Se aplicó el ajuste a 2 productos.',
        cantidadProductosAfectados: 2,
      });
    });

    it('filtra por línea y la nombra en el motivo', async () => {
      const queryBuilder = prepararAjuste([producto(1, 2000)]);
      mockEntityManager.findOne.mockResolvedValue({
        id: 5,
        denominacion: 'BEBIDAS',
      });

      await service.aplicarCambioMasivo({
        tipo: TipoAumento.MONTO_FIJO,
        valor: -1500,
        alcance: AlcanceAjustePrecio.LINEA,
        lineaId: 5,
        usuarioId: 1,
      } as CambioPreciosMasivoDto);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'producto.linea_id = :lineaId',
        { lineaId: 5 },
      );
      expect(mockEntityManager.save).toHaveBeenCalledWith(
        HistorialPrecio,
        expect.objectContaining({
          precioAnterior: 2000,
          precioNuevo: 500,
          motivo: 'Ajuste masivo -$ 1.500 (línea BEBIDAS)',
        }),
      );
    });

    it('no registra historial para productos cuyo precio no cambia', async () => {
      prepararAjuste([producto(1, 100)]);

      await service.aplicarCambioMasivo({
        tipo: TipoAumento.PORCENTAJE,
        valor: 0,
        alcance: AlcanceAjustePrecio.GLOBAL,
        usuarioId: 1,
      } as CambioPreciosMasivoDto);

      expect(mockEntityManager.update).not.toHaveBeenCalled();
      expect(mockEntityManager.save).not.toHaveBeenCalledWith(
        HistorialPrecio,
        expect.anything(),
      );
    });

    it('corta el ajuste dentro de la transacción si un producto queda con precio inválido', async () => {
      prepararAjuste([producto(1, 100), producto(2, 0)]);

      await expect(
        service.aplicarCambioMasivo({
          tipo: TipoAumento.PORCENTAJE,
          valor: 10,
          alcance: AlcanceAjustePrecio.GLOBAL,
          usuarioId: 1,
        } as CambioPreciosMasivoDto),
      ).rejects.toThrow(RangeError);

      // El error escapa del callback de la transacción, que hace rollback.
      expect(mockDataSource.transaction).toHaveBeenCalledTimes(1);
      expect(mockEntityManager.save).not.toHaveBeenCalledWith(
        CambioPreciosMasivoHistorial,
        expect.anything(),
      );
    });

    it('lanza NotFoundException si no hay productos activos en el alcance', async () => {
      prepararAjuste([]);

      await expect(
        service.aplicarCambioMasivo({
          tipo: TipoAumento.PORCENTAJE,
          valor: 10,
          alcance: AlcanceAjustePrecio.GLOBAL,
          usuarioId: 1,
        } as CambioPreciosMasivoDto),
      ).rejects.toThrow(NotFoundException);

      expect(mockEntityManager.save).not.toHaveBeenCalled();
    });
  });

  describe('cambiarPrecio', () => {
    it('cambia el precio y guarda el historial en una única transacción', async () => {
      const producto = Object.assign(new Producto(), {
        id: 1,
        denominacion: 'Laptop HP',
        precio: 100,
        historialPrecios: [],
      });
      mockEntityManager.findOne.mockResolvedValue(producto);
      mockEntityManager.update.mockResolvedValue({ affected: 1 });
      mockEntityManager.save.mockResolvedValue(producto);
      mockDataSource.transaction.mockImplementation(async (callback) =>
        callback(mockEntityManager),
      );

      const resultado = await service.cambiarPrecio(1, {
        precioNuevo: 150,
        motivo: 'Aumento de costo',
        usuarioId: 1,
      });

      expect(mockUsuarioValidator.validarUsuarioExiste).toHaveBeenCalledWith(
        1,
      );
      expect(mockDataSource.transaction).toHaveBeenCalledTimes(1);
      expect(mockEntityManager.findOne).toHaveBeenCalledWith(Producto, {
        where: { id: 1 },
        lock: { mode: 'pessimistic_write' },
      });
      expect(mockEntityManager.update).toHaveBeenCalledWith(Producto, 1, {
        precio: 150,
      });
      expect(mockEntityManager.save).toHaveBeenCalledWith(
        HistorialPrecio,
        expect.objectContaining({
          productoId: 1,
          precioAnterior: 100,
          precioNuevo: 150,
          motivo: 'Aumento de costo',
          usuarioId: 1,
        }),
      );
      expect(resultado).toEqual({
        message: 'Precio actualizado para "Laptop HP"',
        precioAnterior: 100,
        precioActual: 150,
      });
    });

    it('lanza NotFoundException si el producto no existe', async () => {
      mockEntityManager.findOne.mockResolvedValue(null);
      mockDataSource.transaction.mockImplementation(async (callback) =>
        callback(mockEntityManager),
      );

      await expect(
        service.cambiarPrecio(999, {
          precioNuevo: 150,
          motivo: 'motivo',
          usuarioId: 1,
        }),
      ).rejects.toThrow(NotFoundException);

      expect(mockEntityManager.save).not.toHaveBeenCalled();
    });

    it('propaga PrecioInvalidoException sin persistir nada', async () => {
      const producto = Object.assign(new Producto(), {
        id: 1,
        denominacion: 'Laptop HP',
        precio: 100,
        historialPrecios: [],
      });
      mockEntityManager.findOne.mockResolvedValue(producto);
      mockDataSource.transaction.mockImplementation(async (callback) =>
        callback(mockEntityManager),
      );

      await expect(
        service.cambiarPrecio(1, {
          precioNuevo: 0,
          motivo: 'motivo',
          usuarioId: 1,
        }),
      ).rejects.toThrow(PrecioInvalidoException);

      expect(mockEntityManager.update).not.toHaveBeenCalled();
      expect(mockEntityManager.save).not.toHaveBeenCalled();
    });
  });

  describe('findHistorialPrecios', () => {
    it('devuelve el historial paginado ordenado por fecha descendente', async () => {
      mockRepository.findOne.mockResolvedValue({ id: 1 });
      const findAndCount = jest.fn().mockResolvedValue([
        [
          {
            id: 2,
            productoId: 1,
            precioAnterior: 100,
            precioNuevo: 150,
            motivo: 'Aumento',
            fecha: new Date('2026-01-02'),
            usuarioId: 1,
          },
        ],
        1,
      ]);
      mockDataSource.getRepository.mockReturnValue({ findAndCount });

      const resultado = await service.findHistorialPrecios(1, 0, 10);

      expect(mockDataSource.getRepository).toHaveBeenCalledWith(
        HistorialPrecio,
      );
      expect(findAndCount).toHaveBeenCalledWith({
        where: { productoId: 1 },
        order: { fecha: 'DESC' },
        skip: 0,
        take: 10,
      });
      expect(resultado.total).toBe(1);
      expect(resultado.data).toHaveLength(1);
      expect(resultado.data[0]).toEqual(
        expect.objectContaining({ id: 2, precioAnterior: 100, precioNuevo: 150 }),
      );
    });

    it('lanza NotFoundException si el producto no existe', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findHistorialPrecios(999, 0, 10)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('presentación (CR-002)', () => {
    const altaBase = {
      denominacion: 'producto',
      costo: 100,
      utilizaStockMinimo: false,
      utilizaPack: false,
      lineaId: 1,
      marcaId: 1,
      alicuotaIva: 21,
      usuarioCreatedId: 1,
    };

    const modificacionBase = {
      denominacion: 'producto',
      usuarioUpdatedId: 1,
    };

    const envase = (id: number, denominacion: string) =>
      Object.assign(new EnvasePresentacion(), { id, denominacion, sistema: 0 });
    const botella = envase(1, 'BOTELLA');
    const bolsa = envase(2, 'BOLSA');

    const productoGuardado = (columnas: Partial<Producto> = {}) =>
      Object.assign(new Producto(), {
        id: 1,
        denominacion: 'PRODUCTO',
        costo: 100,
        porcentaje: 15,
        lineaId: 1,
        marcaId: 1,
        alicuotaIva: 21,
        envasePresentacionId: null,
        presentacionDimension: null,
        presentacionMagnitudBase: null,
        ...columnas,
      });

    const botella500 = {
      envasePresentacionId: 1,
      envasePresentacion: botella,
      presentacionDimension: 'VOLUMEN',
      presentacionMagnitudBase: 500,
    };

    beforeEach(() => {
      mockRelatedEntitiesValidator.validarYObtenerEntidadesRelacionadas.mockResolvedValue(
        { marca: { id: 1 }, linea: { id: 1 } },
      );
      mockRelatedEntitiesValidator.validarYObtenerEnvasePresentacion.mockImplementation(
        async (id: number) => {
          const encontrado = [botella, bolsa].find((e) => e.id === id);
          if (!encontrado) {
            throw new NotFoundException(
              `Envase de presentación con ID ${id} no encontrado.`,
            );
          }
          return encontrado;
        },
      );
      mockUsuarioValidator.validarUsuarioExiste.mockResolvedValue({ id: 1 });
      mockRepository.save.mockImplementation(async (producto) => producto);
    });

    describe('alta', () => {
      it('persiste BOTELLA 500 ml y lo devuelve en la consulta (ejemplo guía)', async () => {
        // Repositorio en memoria: save guarda la entidad y findOne la devuelve.
        const guardados = new Map<number, Producto>();
        mockRepository.save.mockImplementation(async (producto: Producto) => {
          producto.id ??= guardados.size + 1;
          guardados.set(producto.id, producto);
          return producto;
        });
        mockRepository.findOne.mockImplementation(
          async (id: number) => guardados.get(id) ?? null,
        );

        await service.create({
          ...altaBase,
          presentacion: { envaseId: 1, cantidad: 500, unidad: 'ml' },
        } as CreateProductoDto);
        const dto = await service.findDtoById(1);

        expect(dto.presentacion).toEqual({
          envase: { id: 1, denominacion: 'BOTELLA' },
          contenido: { cantidad: 500, unidad: 'ml' },
          texto: 'BOTELLA 500 ml',
        });
        expect(guardados.get(1)).toMatchObject({
          envasePresentacionId: 1,
          presentacionDimension: 'VOLUMEN',
          presentacionMagnitudBase: 500,
        });
      });

      it.each<[string, null | undefined]>([
        ['ausente', undefined],
        ['null', null],
      ])(
        'rechaza el alta con la presentación %s (PRESENTACION_REQUERIDA)',
        async (_descripcion, presentacion) => {
          await expect(
            service.create({ ...altaBase, presentacion } as CreateProductoDto),
          ).rejects.toThrow(PresentacionRequeridaException);

          expect(mockUniquenessValidator.validarDenominacionUnica).not.toHaveBeenCalled();
          expect(mockRepository.save).not.toHaveBeenCalled();
        },
      );

      it('rechaza un contenido que viola las reglas antes de consultar la base', async () => {
        const alta = service.create({
          ...altaBase,
          presentacion: { envaseId: 1, cantidad: 0, unidad: 'ml' },
        } as CreateProductoDto);

        await expect(alta).rejects.toThrow(PresentacionInvalidaException);
        await expect(alta).rejects.toThrow(
          'La cantidad de la presentación debe ser mayor a 0.',
        );
        expect(mockUniquenessValidator.validarDenominacionUnica).not.toHaveBeenCalled();
        expect(
          mockRelatedEntitiesValidator.validarYObtenerEnvasePresentacion,
        ).not.toHaveBeenCalled();
        expect(mockRepository.save).not.toHaveBeenCalled();
      });

      it('rechaza un envase inexistente (404) sin guardar', async () => {
        await expect(
          service.create({
            ...altaBase,
            presentacion: { envaseId: 99, cantidad: 500, unidad: 'ml' },
          } as CreateProductoDto),
        ).rejects.toThrow(NotFoundException);
        expect(mockRepository.save).not.toHaveBeenCalled();
      });
    });

    describe('modificación', () => {
      it('sin presentación en el DTO, conserva la guardada y no consulta el envase', async () => {
        mockRepository.findOne.mockResolvedValue(productoGuardado(botella500));

        await service.update(1, modificacionBase as UpdateProductoDto);

        expect(mockRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            envasePresentacionId: 1,
            presentacionDimension: 'VOLUMEN',
            presentacionMagnitudBase: 500,
          }),
        );
        expect(
          mockRelatedEntitiesValidator.validarYObtenerEnvasePresentacion,
        ).not.toHaveBeenCalled();
      });

      it('con una presentación válida, reemplaza el envase y el contenido', async () => {
        mockRepository.findOne.mockResolvedValue(productoGuardado(botella500));

        await service.update(1, {
          ...modificacionBase,
          presentacion: { envaseId: 2, cantidad: 1, unidad: 'kg' },
        } as UpdateProductoDto);

        expect(mockRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            envasePresentacionId: 2,
            envasePresentacion: bolsa,
            presentacionDimension: 'MASA',
            presentacionMagnitudBase: 1000,
          }),
        );
      });

      it('con null, no deja quitar la presentación guardada', async () => {
        mockRepository.findOne.mockResolvedValue(productoGuardado(botella500));

        await expect(
          service.update(1, {
            ...modificacionBase,
            presentacion: null,
          } as UpdateProductoDto),
        ).rejects.toThrow(PresentacionRequeridaException);
        expect(mockRepository.save).not.toHaveBeenCalled();
      });

      it('con null, un producto anterior a CR-002 se guarda sin presentación', async () => {
        mockRepository.findOne.mockResolvedValue(productoGuardado());

        await service.update(1, {
          ...modificacionBase,
          presentacion: null,
        } as UpdateProductoDto);

        expect(mockRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            envasePresentacionId: null,
            presentacionDimension: null,
            presentacionMagnitudBase: null,
          }),
        );
      });

      it('rechaza un contenido que viola las reglas sin guardar', async () => {
        mockRepository.findOne.mockResolvedValue(productoGuardado(botella500));

        const modificacion = service.update(1, {
          ...modificacionBase,
          presentacion: { envaseId: 1, cantidad: 2.5, unidad: 'ml' },
        } as UpdateProductoDto);

        await expect(modificacion).rejects.toThrow(
          PresentacionInvalidaException,
        );
        await expect(modificacion).rejects.toThrow(
          'Los ml no admiten decimales.',
        );
        expect(mockUniquenessValidator.validarDenominacionUnica).not.toHaveBeenCalled();
        expect(mockRepository.save).not.toHaveBeenCalled();
      });

      it('rechaza un envase inexistente (404) y deja la presentación como estaba', async () => {
        const producto = productoGuardado(botella500);
        mockRepository.findOne.mockResolvedValue(producto);

        await expect(
          service.update(1, {
            ...modificacionBase,
            presentacion: { envaseId: 99, cantidad: 1, unidad: 'L' },
          } as UpdateProductoDto),
        ).rejects.toThrow(NotFoundException);
        expect(mockRepository.save).not.toHaveBeenCalled();
        expect(producto).toMatchObject({
          envasePresentacionId: 1,
          presentacionMagnitudBase: 500,
        });
      });
    });

    describe('denominación automática (CR-005)', () => {
      const marcaCocaCola = { id: 1, denominacion: 'COCA-COLA' };
      const lineaGaseosas = { id: 1, denominacion: 'GASEOSAS' };

      beforeEach(() => {
        mockRelatedEntitiesValidator.validarYObtenerEntidadesRelacionadas.mockResolvedValue(
          { marca: marcaCocaCola, linea: lineaGaseosas },
        );
      });

      it('genera "Marca Línea Presentación" (con envase) cuando generarDenominacionAutomatica es true y no se envía denominación', async () => {
        const { denominacion, ...altaSinDenominacion } = altaBase;

        await service.create({
          ...altaSinDenominacion,
          generarDenominacionAutomatica: true,
          presentacion: { envaseId: 1, cantidad: 500, unidad: 'ml' },
        } as CreateProductoDto);

        expect(
          mockUniquenessValidator.validarDenominacionUnica,
        ).toHaveBeenCalledWith('COCA-COLA GASEOSAS BOTELLA 500 ml');
        expect(mockRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            denominacion: 'COCA-COLA GASEOSAS BOTELLA 500 ml',
          }),
        );
      });

      it('ignora cualquier denominación recibida cuando generarDenominacionAutomatica es true', async () => {
        await service.create({
          ...altaBase,
          denominacion: 'ESTO SE IGNORA',
          generarDenominacionAutomatica: true,
          presentacion: { envaseId: 1, cantidad: 500, unidad: 'ml' },
        } as CreateProductoDto);

        expect(mockRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            denominacion: 'COCA-COLA GASEOSAS BOTELLA 500 ml',
          }),
        );
      });

      it('el envase distingue productos con igual Marca+Línea+contenido (botella vs. lata no colisionan)', async () => {
        const { denominacion, ...altaSinDenominacion } = altaBase;

        await service.create({
          ...altaSinDenominacion,
          generarDenominacionAutomatica: true,
          presentacion: { envaseId: 1, cantidad: 500, unidad: 'ml' },
        } as CreateProductoDto);
        await service.create({
          ...altaSinDenominacion,
          generarDenominacionAutomatica: true,
          presentacion: { envaseId: 2, cantidad: 500, unidad: 'ml' },
        } as CreateProductoDto);

        expect(mockRepository.save).toHaveBeenNthCalledWith(
          1,
          expect.objectContaining({
            denominacion: 'COCA-COLA GASEOSAS BOTELLA 500 ml',
          }),
        );
        expect(mockRepository.save).toHaveBeenNthCalledWith(
          2,
          expect.objectContaining({
            denominacion: 'COCA-COLA GASEOSAS BOLSA 500 ml',
          }),
        );
      });

      it('con generarDenominacionAutomatica en false u omitido, conserva tal cual la denominación manual enviada', async () => {
        await service.create({
          ...altaBase,
          denominacion: 'mi denominación manual',
          presentacion: { envaseId: 1, cantidad: 500, unidad: 'ml' },
        } as CreateProductoDto);

        expect(
          mockUniquenessValidator.validarDenominacionUnica,
        ).toHaveBeenCalledWith('mi denominación manual');
        expect(mockRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({ denominacion: 'mi denominación manual' }),
        );
      });

      it('un cambio posterior de marca, línea o presentación por PUT no regenera la denominación generada al alta', async () => {
        // precio explícito = costo(100) × margen(15 %) para que la edición no
        // recalcule el precio: ese camino usa la transacción de historial,
        // que en este archivo ya falla sin mockear (bug previo, no de CR-005).
        const producto = productoGuardado({
          denominacion: 'COCA-COLA GASEOSAS BOTELLA 500 ml',
          precio: 115,
          ...botella500,
        });
        mockRepository.findOne.mockResolvedValue(producto);

        await service.update(1, {
          usuarioUpdatedId: 1,
          marcaId: 1,
          lineaId: 1,
          presentacion: { envaseId: 2, cantidad: 1, unidad: 'kg' },
        } as UpdateProductoDto);

        expect(mockRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            denominacion: 'COCA-COLA GASEOSAS BOTELLA 500 ml',
            envasePresentacionId: 2,
          }),
        );
      });
    });
  });
});
