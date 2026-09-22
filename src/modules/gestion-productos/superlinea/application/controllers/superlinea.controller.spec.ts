// Mockear @nestjs/mapped-types para evitar el error de ESM/CJS
jest.mock('@nestjs/mapped-types', () => ({
  PartialType: () => class {},
  OmitType: () => class {},
  IntersectionType: () => class {},
  PickType: () => class {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { SuperLineaController } from './superlinea.controller';
import { SuperLineaService } from '../services/superlinea.service';
import { AuthGuard } from 'src/modules/gestion-usuario/auth/auth.guard';

// ==================== MOCK DEL SERVICIO ====================
const mockSuperLineaService = {
  create: jest.fn(),
  update: jest.fn(),
  findByDenominacionFiltered: jest.fn(),
  findAllFor: jest.fn(),
  findDtoById: jest.fn(),
  findByIdConAuditoria: jest.fn(),
  remove: jest.fn(),
};

describe('SuperLineaController', () => {
  let controller: SuperLineaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SuperLineaController],
      providers: [
        { provide: SuperLineaService, useValue: mockSuperLineaService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<SuperLineaController>(SuperLineaController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('delega al service y devuelve el mensaje', async () => {
      const dto = { denominacion: 'bebidas', usuarioCreatedId: 1 } as any;
      const mensaje = { message: 'SuperLinea bebidas creada' };
      mockSuperLineaService.create.mockResolvedValue(mensaje);

      const result = await controller.create(dto);

      expect(mockSuperLineaService.create).toHaveBeenCalledWith(dto);
      expect(result).toBe(mensaje);
    });
  });

  describe('findByDenominacionFiltered', () => {
    it('pasa denominación, paginación y superlineaId al service', async () => {
      const paginationDto = {
        denominacion: 'beb',
        skip: 0,
        take: 10,
        incluirEliminados: false,
      } as any;
      const resultado = { data: [], total: 0 };
      mockSuperLineaService.findByDenominacionFiltered.mockResolvedValue(
        resultado,
      );

      const result = await controller.findByDenominacionFiltered(
        paginationDto,
      );

      expect(
        mockSuperLineaService.findByDenominacionFiltered,
      ).toHaveBeenCalledWith('beb', 0, 10, false);
      expect(result).toBe(resultado);
    });

    it('usa denominación vacía si no viene', async () => {
      const paginationDto = { skip: 0, take: 10 } as any;
      mockSuperLineaService.findByDenominacionFiltered.mockResolvedValue({
        data: [],
        total: 0,
      });

      await controller.findByDenominacionFiltered(paginationDto);

      expect(
        mockSuperLineaService.findByDenominacionFiltered,
      ).toHaveBeenCalledWith('', 0, 10, undefined);
    });
  });

  describe('findOne', () => {
    it('delega al service con el id parseado', async () => {
      const dto = { id: 1, denominacion: 'bebidas' };
      mockSuperLineaService.findDtoById.mockResolvedValue(dto);

      const result = await controller.findOne(1);

      expect(mockSuperLineaService.findDtoById).toHaveBeenCalledWith(1);
      expect(result).toBe(dto);
    });
  });

  describe('update', () => {
    it('delega al service con id y dto', async () => {
      const dto = { denominacion: 'almacen', usuarioUpdatedId: 1 } as any;
      const mensaje = { message: 'SuperLinea almacen editada' };
      mockSuperLineaService.update.mockResolvedValue(mensaje);

      const result = await controller.update(5, dto);

      expect(mockSuperLineaService.update).toHaveBeenCalledWith(5, dto);
      expect(result).toBe(mensaje);
    });
  });

  describe('remove', () => {
    it('delega al service con id y usuarioId', async () => {
      const mensaje = { message: 'SuperLinea bebidas eliminada' };
      mockSuperLineaService.remove.mockResolvedValue(mensaje);

      const result = await controller.remove(3, 99);

      expect(mockSuperLineaService.remove).toHaveBeenCalledWith(3, 99);
      expect(result).toBe(mensaje);
    });
  });

  describe('findByIdConAuditoria', () => {
    it('delega al service', async () => {
      const auditoria = { id: 1, detalle: 'superlinea bebidas' };
      mockSuperLineaService.findByIdConAuditoria.mockResolvedValue(auditoria);

      const result = await controller.findByIdConAuditoria(1);

      expect(mockSuperLineaService.findByIdConAuditoria).toHaveBeenCalledWith(
        1,
      );
      expect(result).toBe(auditoria);
    });
  });
});