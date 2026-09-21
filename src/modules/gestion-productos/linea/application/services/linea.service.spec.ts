import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { validate } from 'class-validator';

import { LineaService } from './linea.service';
import { ILineaRepository } from '../../domain/interfaces/linea.repository.interface';
import { PoliticaEliminacionLinea } from '../../domain/services/politica-eliminacion-linea.service';
import { UsuarioService } from '../../../../gestion-usuario/usuario/application/services/usuario.service';
import { Linea } from '../../domain/entities/linea.entity';
import { SuperLinea } from '../../../superlinea/domain/entities/superlinea.entity';
import { CreateLineaDto } from '../../dto/create-linea.dto';

// ==================== MOCKS ====================

const mockRepository = {
  create: jest.fn(),
  update: jest.fn(),
  findOne: jest.fn(),
  findByDenominacionFiltered: jest.fn(),
  findByDenominacionWith: jest.fn(),
  findByIdConAuditoria: jest.fn(),
  findAllFor: jest.fn(),
  findAllListado: jest.fn(),
  findAgrupadasPorSuperlinea: jest.fn(),
  remove: jest.fn(),
  reassignSuperlinea: jest.fn(),
};

const mockPoliticaEliminacionLinea = {
  tieneProductosActivosParaLinea: jest.fn(),
};

const mockUsuarioService = {
  findOne: jest.fn(),
};

const mockSuperLineaRepository = {
  findOne: jest.fn(),
};

const buildSuperLinea = (overrides: Partial<SuperLinea> = {}): SuperLinea =>
  ({
    id: 1,
    denominacion: 'bebidas',
    observacion: '',
    sistema: 0,
    ...overrides,
  }) as SuperLinea;

const buildLinea = (overrides: Partial<Linea> = {}): Linea =>
  ({
    id: 1,
    denominacion: 'gaseosas',
    observacion: '',
    superlineaId: 1,
    superlinea: buildSuperLinea(),
    utilizaStockMinimo: false,
    stockMinimo: 0,
    sistema: 0,
    ...overrides,
  }) as Linea;

describe('LineaService', () => {
  let service: LineaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LineaService,
        { provide: 'ILineaRepository', useValue: mockRepository },
        {
          provide: PoliticaEliminacionLinea,
          useValue: mockPoliticaEliminacionLinea,
        },
        { provide: UsuarioService, useValue: mockUsuarioService },
        {
          provide: 'ISuperLineaRepository',
          useValue: mockSuperLineaRepository,
        },
      ],
    }).compile();

    service = module.get<LineaService>(LineaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ==================== create ====================

  describe('validación de SuperLínea', () => {
    const dtoValido = {
      denominacion: 'gaseosas',
      superlineaId: 1,
      utilizaStockMinimo: false,
      usuarioCreatedId: 1,
    };

    it('rechaza crear una Línea sin SuperLínea', async () => {
      const { superlineaId, ...dtoSinSuperlinea } = dtoValido;
      const errors = await validate(
        Object.assign(new CreateLineaDto(), dtoSinSuperlinea),
      );

      expect(errors.some((error) => error.property === 'superlineaId')).toBe(
        true,
      );
    });

    it('rechaza un identificador de SuperLínea menor a uno', async () => {
      const errors = await validate(
        Object.assign(new CreateLineaDto(), { ...dtoValido, superlineaId: 0 }),
      );

      expect(errors.some((error) => error.property === 'superlineaId')).toBe(
        true,
      );
    });
  });

  describe('create', () => {
    it('crea una Línea con SuperLínea válida', async () => {
      const dto = {
        denominacion: 'gaseosas',
        superlineaId: 1,
        utilizaStockMinimo: false,
        usuarioCreatedId: 1,
      } as any;

      mockRepository.findByDenominacionWith.mockResolvedValue(null);
      mockSuperLineaRepository.findOne.mockResolvedValue(buildSuperLinea());
      mockRepository.create.mockResolvedValue(buildLinea());

      const result = await service.create(dto);

      expect(mockSuperLineaRepository.findOne).toHaveBeenCalledWith(1);
      expect(mockRepository.create).toHaveBeenCalledWith(dto);
      expect(result).toBeDefined();
    });

    it('lanza 404 si la SuperLínea no existe', async () => {
      const dto = {
        denominacion: 'gaseosas',
        superlineaId: 999,
        utilizaStockMinimo: false,
        usuarioCreatedId: 1,
      } as any;

      mockRepository.findByDenominacionWith.mockResolvedValue(null);
      mockSuperLineaRepository.findOne.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  // ==================== update ====================

  describe('update', () => {
    it('actualiza reasignando SuperLínea si viene superlineaId', async () => {
      const dto = {
        superlineaId: 2,
        usuarioUpdatedId: 1,
      } as any;

      mockRepository.findOne.mockResolvedValue(buildLinea());
      mockSuperLineaRepository.findOne.mockResolvedValue(
        buildSuperLinea({ id: 2, denominacion: 'almacen' }),
      );
      mockRepository.update.mockResolvedValue(
        buildLinea({ superlineaId: 2 }),
      );

      await service.update(1, dto);

      expect(mockSuperLineaRepository.findOne).toHaveBeenCalledWith(2);
      expect(mockRepository.update).toHaveBeenCalledWith(1, dto);
    });

    it('lanza 404 si la nueva SuperLínea no existe', async () => {
      const dto = { superlineaId: 999, usuarioUpdatedId: 1 } as any;

      mockRepository.findOne.mockResolvedValue(buildLinea());
      mockSuperLineaRepository.findOne.mockResolvedValue(null);

      await expect(service.update(1, dto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('valida el ID cero antes de actualizar la asociación', async () => {
      const dto = { superlineaId: 0, usuarioUpdatedId: 1 } as any;

      mockRepository.findOne.mockResolvedValue(buildLinea());
      mockSuperLineaRepository.findOne.mockResolvedValue(null);

      await expect(service.update(1, dto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(mockSuperLineaRepository.findOne).toHaveBeenCalledWith(0);
      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });

  // ==================== búsquedas ====================

  describe('findByDenominacionFiltered', () => {
    it('pasa el filtro de SuperLínea al repositorio', async () => {
      mockRepository.findByDenominacionFiltered.mockResolvedValue({
        data: [buildLinea()],
        total: 1,
      });

      const result = await service.findByDenominacionFiltered(
        'gas',
        0,
        10,
        false,
        1,
      );

      expect(mockRepository.findByDenominacionFiltered).toHaveBeenCalledWith(
        'gas',
        0,
        10,
        false,
        1,
      );
      expect(result.data).toHaveLength(1);
      expect(result.data[0].superlineaId).toBe(1);
    });

    it('funciona sin filtro de SuperLínea', async () => {
      mockRepository.findByDenominacionFiltered.mockResolvedValue({
        data: [buildLinea()],
        total: 1,
      });

      await service.findByDenominacionFiltered('gas', 0, 10);

      expect(mockRepository.findByDenominacionFiltered).toHaveBeenCalledWith(
        'gas',
        0,
        10,
        false,
        undefined,
      );
    });
  });

  describe('findAgrupadasPorSuperlinea', () => {
    it('agrupa las Líneas por SuperLínea', async () => {
      mockRepository.findAgrupadasPorSuperlinea.mockResolvedValue([
        buildLinea({ id: 1, denominacion: 'gaseosas', superlineaId: 1 }),
        buildLinea({ id: 2, denominacion: 'jugos', superlineaId: 1 }),
        buildLinea({
          id: 3,
          denominacion: 'harinas',
          superlineaId: 2,
          superlinea: buildSuperLinea({ id: 2, denominacion: 'almacen' }),
        }),
      ]);

      const result = await service.findAgrupadasPorSuperlinea();

      expect(result).toHaveLength(2);

      const bebidas = result.find((g) => g.superlineaId === 1);
      expect(bebidas?.lineas).toHaveLength(2);
      expect(bebidas?.total).toBe(2);
      expect(bebidas?.superlineaDenominacion).toBe('bebidas');

      const almacen = result.find((g) => g.superlineaId === 2);
      expect(almacen?.lineas).toHaveLength(1);
      expect(almacen?.total).toBe(1);
    });

    it('devuelve array vacío si no hay Líneas', async () => {
      mockRepository.findAgrupadasPorSuperlinea.mockResolvedValue([]);

      const result = await service.findAgrupadasPorSuperlinea();

      expect(result).toEqual([]);
    });

    it('pasa el filtro de SuperLínea al repositorio', async () => {
      mockRepository.findAgrupadasPorSuperlinea.mockResolvedValue([]);

      await service.findAgrupadasPorSuperlinea(false, 5);

      expect(
        mockRepository.findAgrupadasPorSuperlinea,
      ).toHaveBeenCalledWith(false, 5);
    });
  });
});
