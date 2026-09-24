// Mockear @nestjs/mapped-types para evitar el error de ESM/CJS
jest.mock('@nestjs/mapped-types', () => ({
  PartialType: () => class {},
  OmitType: () => class {},
  IntersectionType: () => class {},
  PickType: () => class {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { ProductoController } from './producto.controller';
import { ProductoService } from '../services/producto.service';
import { AuthGuard } from 'src/modules/gestion-usuario/auth/auth.guard';

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
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ProductoController>(ProductoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('propaga los filtros parciales de denominación, línea y SuperLínea', async () => {
    mockProductoService.findBy.mockResolvedValue({ data: [], total: 0 });

    await controller.search({
      denominacion: 'leche',
      linea: 'lacteos',
      superlinea: 'bebidas',
      codigoProveedor: '',
      codProveedorExacto: false,
      codigoReferencia: '',
      codReferenciaExacto: false,
      marcaId: 0,
      lineaId: 0,
      proveedorId: 0,
      conStock: false,
      skip: 0,
      take: 10,
      incluirEliminados: false,
    });

    expect(mockProductoService.findBy).toHaveBeenCalledWith(
      'leche',
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
      false,
    );
  });
});