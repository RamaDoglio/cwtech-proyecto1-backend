import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { SuperLineaService } from './superlinea.service';
import { ISuperLineaRepository } from '../../domain/interfaces/superlinea.repository.interface';
import { UsuarioService } from 'src/modules/gestion-usuario/usuario/application/services/usuario.service';
import { SuperLinea } from '../../domain/entities/superlinea.entity';

// ==================== MOCKS ====================

const mockRepository = {
  create: jest.fn(),
  update: jest.fn(),
  findOne: jest.fn(),
  findByDenominacionFiltered: jest.fn(),
  findByDenominacionWith: jest.fn(),
  findAllFor: jest.fn(),
  findAllListado: jest.fn(),
  findByIdConAuditoria: jest.fn(),
  remove: jest.fn(),
  removeAndReassign: jest.fn(),
};

const mockUsuarioService = {
  findOne: jest.fn(),
};

const buildSuperLinea = (overrides: Partial<SuperLinea> = {}): SuperLinea =>
  ({
    id: 1,
    denominacion: 'bebidas',
    observacion: '',
    sistema: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
    ...overrides,
  }) as SuperLinea;

describe('SuperLineaService', () => {
  let service: SuperLineaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuperLineaService,
        { provide: 'ISuperLineaRepository', useValue: mockRepository },
        { provide: UsuarioService, useValue: mockUsuarioService },
      ],
    }).compile();

    service = module.get<SuperLineaService>(SuperLineaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ==================== create ====================

  describe('create', () => {
    it('crea una SuperLínea cuando la denominación no existe', async () => {
      const dto = {
        denominacion: 'bebidas',
        usuarioCreatedId: 1,
      } as any;
      mockRepository.findByDenominacionWith.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(buildSuperLinea());

      const result = await service.create(dto);

      expect(mockRepository.findByDenominacionWith).toHaveBeenCalledWith(
        'BEBIDAS',
      );
      expect(mockRepository.create).toHaveBeenCalledWith(dto);
      expect(result).toBeDefined();
    });

    it('rechaza si la denominación ya existe', async () => {
      const dto = { denominacion: 'bebidas', usuarioCreatedId: 1 } as any;
      mockRepository.findByDenominacionWith.mockResolvedValue(
        buildSuperLinea({ id: 2 }),
      );

      await expect(service.create(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  // ==================== update ====================

  describe('update', () => {
    it('actualiza cuando la SuperLínea existe y no es de sistema', async () => {
      const dto = {
        denominacion: 'almacen',
        usuarioUpdatedId: 1,
      } as any;
      mockRepository.findOne.mockResolvedValue(buildSuperLinea());
      mockRepository.findByDenominacionWith.mockResolvedValue(null);
      mockRepository.update.mockResolvedValue(
        buildSuperLinea({ denominacion: 'almacen' }),
      );

      const result = await service.update(1, dto);

      expect(mockRepository.update).toHaveBeenCalledWith(1, dto);
      expect(result).toBeDefined();
    });

    it('rechaza actualizar una SuperLínea de sistema', async () => {
      mockRepository.findOne.mockResolvedValue(
        buildSuperLinea({ sistema: 1 }),
      );

      await expect(
        service.update(1, { usuarioUpdatedId: 1 } as any),
      ).rejects.toThrow();
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('lanza 404 si no existe', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(99, { usuarioUpdatedId: 1 } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  // ==================== remove ====================

  describe('remove', () => {
    it('reasigna Líneas a "Sin clasificar" y elimina', async () => {
      const sinClasificar = buildSuperLinea({
        id: 99,
        denominacion: 'sin clasificar',
        sistema: 1,
      });
      const aEliminar = buildSuperLinea({ id: 5, denominacion: 'bebidas' });

      mockRepository.findOne.mockResolvedValue(aEliminar);
      mockRepository.findByDenominacionFiltered.mockResolvedValue({
        data: [sinClasificar],
        total: 1,
      });
      mockUsuarioService.findOne.mockResolvedValue({ id: 1 });
      mockRepository.removeAndReassign.mockResolvedValue(3);

      const result = await service.remove(5, 1);

      expect(mockRepository.removeAndReassign).toHaveBeenCalledWith(
        aEliminar,
        { id: 1 },
        99,
      );
      expect(result).toBeDefined();
    });

    it('rechaza eliminar la SuperLínea "Sin clasificar"', async () => {
      const sinClasificar = buildSuperLinea({
        id: 99,
        denominacion: 'sin clasificar',
        sistema: 1,
      });
      mockRepository.findOne.mockResolvedValue(sinClasificar);
      mockRepository.findByDenominacionFiltered.mockResolvedValue({
        data: [sinClasificar],
        total: 1,
      });
      mockUsuarioService.findOne.mockResolvedValue({ id: 1 });

      await expect(service.remove(99, 1)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(mockRepository.remove).not.toHaveBeenCalled();
      expect(mockRepository.removeAndReassign).not.toHaveBeenCalled();
    });

    it('rechaza eliminar una SuperLínea de sistema', async () => {
      mockRepository.findOne.mockResolvedValue(
        buildSuperLinea({ id: 5, sistema: 1 }),
      );
      mockRepository.findByDenominacionFiltered.mockResolvedValue({
        data: [buildSuperLinea({ id: 99, denominacion: 'sin clasificar', sistema: 1 })],
        total: 1,
      });

      await expect(service.remove(5, 1)).rejects.toThrow();
      expect(mockRepository.remove).not.toHaveBeenCalled();
    });

    it('lanza 404 si el usuario no existe', async () => {
      mockRepository.findOne.mockResolvedValue(buildSuperLinea());
      mockUsuarioService.findOne.mockResolvedValue(null);

      await expect(service.remove(1, 99)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('lanza 404 si "Sin clasificar" no existe', async () => {
      mockRepository.findOne.mockResolvedValue(buildSuperLinea({ id: 5 }));
      mockRepository.findByDenominacionFiltered.mockResolvedValue({
        data: [],
        total: 0,
      });
      mockUsuarioService.findOne.mockResolvedValue({ id: 1 });

      await expect(service.remove(5, 1)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  // ==================== búsquedas ====================

  describe('findByDenominacionFiltered', () => {
    it('devuelve datos mapeados y total paginado', async () => {
      mockRepository.findByDenominacionFiltered.mockResolvedValue({
        data: [buildSuperLinea()],
        total: 1,
      });

      const result = await service.findByDenominacionFiltered('beb', 0, 10);

      expect(mockRepository.findByDenominacionFiltered).toHaveBeenCalledWith(
        'beb',
        0,
        10,
        false,
      );
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(1);
    });
  });

  describe('findDtoById', () => {
    it('lanza 404 si no existe', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findDtoById(99)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('devuelve el DTO mapeado', async () => {
      mockRepository.findOne.mockResolvedValue(buildSuperLinea());

      const result = await service.findDtoById(1);

      expect(result.id).toBe(1);
      expect(result.denominacion).toBe('bebidas');
    });
  });
});
