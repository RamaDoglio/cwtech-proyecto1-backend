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

// ==================== MOCKS ====================
// Cada dependencia debe tener al menos los métodos que el servicio invoca.

const mockRepository = {
  create: jest.fn(),
  update: jest.fn(),
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
describe('ProductoService', () => {
  let service: ProductoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductoService,
        { provide: 'IProductoRepository', useValue: mockRepository },
        { provide: LineaService, useValue: mockLineaService },
        { provide: MarcaService, useValue: mockMarcaService },
        { provide: ProveedorService, useValue: mockProveedorService },
        { provide: UsuarioService, useValue: mockUsuarioService },
        { provide: ProductoIntrinsicValidationService, useValue: mockIntrinsicValidationService },
        { provide: ProductoValidationService, useValue: mockValidationService },
        { provide: ProductoRelatedEntitiesValidator, useValue: mockRelatedEntitiesValidator },
        { provide: ProductoUniquenessValidator, useValue: mockUniquenessValidator },
        { provide: UsuarioValidator, useValue: mockUsuarioValidator },
        { provide: ProductoDeletePolicy, useValue: mockProductoDeletePolicy },
      ],
    }).compile();

    service = module.get<ProductoService>(ProductoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('resuelve costo, margen y precio antes de crear el producto', async () => {
    mockRelatedEntitiesValidator.validarYObtenerEntidadesRelacionadas.mockResolvedValue({
      marca: { id: 1 },
      linea: { id: 1 },
    });
    mockUsuarioValidator.validarUsuarioExiste.mockResolvedValue({ id: 1 });
    mockRepository.create.mockResolvedValue({ denominacion: 'producto' });

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

    expect(mockRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ costo: 100, margen: 15, precio: 115 }),
      { id: 1 },
      { id: 1 },
      { id: 1 },
    );
  });
});
