// Mockear @nestjs/mapped-types para evitar el error de ESM/CJS
jest.mock('@nestjs/mapped-types', () => ({
  PartialType: () => class {},
  OmitType: () => class {},
  IntersectionType: () => class {},
  PickType: () => class {},
}));

// @nestjs/swagger resuelve otra versión de mapped-types que no expone
// inheritValidationMetadata en este entorno de Jest.
jest.mock('@nestjs/swagger', () => {
  const actual = jest.requireActual('@nestjs/swagger');
  return { ...actual, PartialType: () => class {} };
});

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
  previewCambioMasivo: jest.fn(),
  aplicarCambioMasivo: jest.fn(),
  ajustarStockManual: jest.fn(),
  cambiarPrecio: jest.fn(),
  findHistorialPrecios: jest.fn(),
};

describe('ProductoController', () => {
  let controller: ProductoController;

  beforeEach(async () => {
    jest.clearAllMocks();
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
    );
  });

  it('delega el alta, consultas de catálogos y búsqueda rápida', async () => {
    const dto = { denominacion: 'LECHE' } as any;
    mockProductoService.create.mockResolvedValue({ id: 1 });
    mockProductoService.findAllForMarcas.mockResolvedValue([]);
    mockProductoService.findAllForLineas.mockResolvedValue([]);
    mockProductoService.findByRapido.mockResolvedValue({ data: [], total: 0 });

    await expect(controller.create(dto)).resolves.toEqual({ id: 1 });
    await controller.findAllMarcasFor({ denominacion: 'nat' } as any);
    await controller.findAllLineasFor({} as any);
    await controller.searchRapido({ codigo: 'ABC', exacto: true, skip: 0, take: 10 } as any);

    expect(mockProductoService.findAllForMarcas).toHaveBeenCalledWith('nat');
    expect(mockProductoService.findAllForLineas).toHaveBeenCalledWith('');
    expect(mockProductoService.findByRapido).toHaveBeenCalledWith('ABC', true, 0, 10);
  });

  it('delega las consultas de Marca, Línea, detalle, alta y modificación', async () => {
    mockProductoService.buscarMarcaDesdeProducto.mockResolvedValue({ id: 1 });
    mockProductoService.buscarLineaDesdeProducto.mockResolvedValue({ id: 2 });
    mockProductoService.findDtoById.mockResolvedValue({ id: 3 });
    mockProductoService.update.mockResolvedValue({ id: 3 });

    await expect(controller.getMarcaDelProducto(3)).resolves.toEqual({ id: 1 });
    await expect(controller.geLineaDelProducto(3)).resolves.toEqual({ id: 2 });
    await expect(controller.findOne(3)).resolves.toEqual({ id: 3 });
    await expect(controller.update(3, { denominacion: 'NUEVA' } as any)).resolves.toEqual({ id: 3 });

    expect(mockProductoService.buscarMarcaDesdeProducto).toHaveBeenCalledWith(3);
    expect(mockProductoService.buscarLineaDesdeProducto).toHaveBeenCalledWith(3);
    expect(mockProductoService.update).toHaveBeenCalledWith(3, { denominacion: 'NUEVA' });
  });

  it('delega el preview, aplicación masiva, baja y auditoría', async () => {
    const dto = { alcance: 'GLOBAL' } as any;
    mockProductoService.previewCambioMasivo.mockResolvedValue({ items: [] });
    mockProductoService.aplicarCambioMasivo.mockResolvedValue({ cantidadProductosAfectados: 0 });
    mockProductoService.remove.mockResolvedValue({ message: 'ok' });
    mockProductoService.findByIdConAuditoria.mockResolvedValue({ id: 4 });

    await expect(controller.previewCambioMasivo(dto)).resolves.toEqual({ items: [] });
    await expect(controller.aplicarCambioMasivo(dto)).resolves.toEqual({ cantidadProductosAfectados: 0 });
    await expect(controller.remove(4, 8)).resolves.toEqual({ message: 'ok' });
    await expect(controller.findByIdConAuditoria(4)).resolves.toEqual({ id: 4 });

    expect(mockProductoService.remove).toHaveBeenCalledWith(4, 8);
    expect(mockProductoService.findByIdConAuditoria).toHaveBeenCalledWith(4);
  });

  it('delega el ajuste manual, cambio de precio e historial', async () => {
    mockProductoService.ajustarStockManual.mockResolvedValue({ stock: 5 });
    mockProductoService.cambiarPrecio.mockResolvedValue({ precioActual: 20 });
    mockProductoService.findHistorialPrecios.mockResolvedValue({ data: [], total: 0 });

    await expect(controller.ajustarManual(1, { cantidad: 2, usuarioId: 8 } as any)).resolves.toEqual({ stock: 5 });
    await expect(controller.cambiarPrecio(1, { precioNuevo: 20, usuarioId: 8 } as any)).resolves.toEqual({ precioActual: 20 });
    await expect(controller.findHistorialPrecios(1, { skip: 0, take: 10 } as any)).resolves.toEqual({ data: [], total: 0 });

    expect(mockProductoService.ajustarStockManual).toHaveBeenCalledWith(1, { cantidad: 2, usuarioId: 8 });
    expect(mockProductoService.cambiarPrecio).toHaveBeenCalledWith(1, { precioNuevo: 20, usuarioId: 8 });
    expect(mockProductoService.findHistorialPrecios).toHaveBeenCalledWith(1, 0, 10);
  });
});
