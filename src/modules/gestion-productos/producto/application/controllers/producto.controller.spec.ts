import { Test, TestingModule } from '@nestjs/testing';
import { ProductoController } from './producto.controller';
import { ProductoService } from '../services/producto.service';

// Mock del servicio, sin necesidad de importar DTOs
const mockProductoService = {
  create: jest.fn(),
  findAllForMarcas: jest.fn(),
  findAllForLineas: jest.fn(),
  findByRapido: jest.fn(),
  findBy: jest.fn(),
  buscarMarcaDesdeProducto: jest.fn(),
  buscarLineaDesdeProducto: jest.fn(),
  findDtoById: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  findByIdConAuditoria: jest.fn(),
};

describe('ProductoController', () => {
  let controller: ProductoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductoController],
      providers: [
        { provide: ProductoService, useValue: mockProductoService },
      ],
    }).compile();

    controller = module.get<ProductoController>(ProductoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});