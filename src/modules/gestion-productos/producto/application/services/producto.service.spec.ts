import { Test, TestingModule } from '@nestjs/testing';
import { ProductoService } from './producto.service';
import { IProductoRepository } from '../../domain/interfaces/producto.repository-interface';
import { LineaService } from '../../../linea/application/services/linea.service';
import { MarcaService } from '../../../marca/application/services/marca.service';
import { ProveedorService } from '../../../../organizacion/proveedor/application/services/proveedor.service';
import { UsuarioService } from '../../../../gestion-usuario/usuario/application/services/usuario.service';
import { ProductoIntrinsicValidationService } from '../../domain/services/producto-intrinsic-validation.service.ts';
import { ProductoValidationService } from '../../domain/services/producto-validation.service.ts';
import { ProductoRelatedEntitiesValidator } from '../../infraestructure/validators/producto-related-entities.validator.ts';
import { ProductoUniquenessValidator } from '../../infraestructure/validators/producto-uniqueness.validator.ts';
import { UsuarioValidator } from '../../../../common/utils/validation/usuario-validator';
import { ProductoDeletePolicy } from '../policies/producto-delete.policy';
import { CreateProductoDto } from '../../dto/create-producto.dto';
import { UpdateProductoDto } from '../../dto/update-producto.dto';
import { DataSource } from 'typeorm';
import { Producto } from '../../domain/entities/producto.entity';
import { MovimientoStock } from '../../domain/entities/movimiento-stock.entity';

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
};
const mockDataSource = {
  transaction: jest.fn(),
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
    } as CreateProductoDto);

    expect(mockRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ costo: 100, porcentaje: 15, precio: 115 }),
    );
  });

  it('recalcula el precio al actualizar el costo o el margen', async () => {
    mockRepository.findOne.mockResolvedValue({
      id: 1,
      denominacion: 'producto',
      costo: 100,
      porcentaje: 15,
      lineaId: 1,
      marcaId: 1,
      alicuotaIva: 21,
    });
    mockRelatedEntitiesValidator.validarYObtenerEntidadesRelacionadas.mockResolvedValue(
      {
        marca: { id: 1 },
        linea: { id: 1 },
      },
    );
    mockUsuarioValidator.validarUsuarioExiste.mockResolvedValue({ id: 1 });
    mockRepository.save.mockImplementation(async (producto) => producto);

    await service.update(1, {
      denominacion: 'producto',
      costo: 200,
      margen: 0,
      usuarioUpdatedId: 1,
    } as UpdateProductoDto);

    expect(mockRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ costo: 200, porcentaje: 0, precio: 200 }),
    );
  });
});
