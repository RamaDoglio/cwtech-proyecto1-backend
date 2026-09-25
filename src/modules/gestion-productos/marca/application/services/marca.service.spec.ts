import { ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MarcaService } from './marca.service';
import { IMarcaRepository } from '../../domain/interfaces/marca.repository.interface';
import { UsuarioService } from '../../../../gestion-usuario/usuario/application/services/usuario.service';
import { PoliticaEliminacionMarca } from '../../domain/services/politica-eliminacion-marca.service';

// ==================== MOCKS ====================

const mockRepository = {
  create: jest.fn(),
  update: jest.fn(),
  findOne: jest.fn(),
  findBy: jest.fn(),
  findByIdConAuditoria: jest.fn(),
  findAllFor: jest.fn(),
  findAllListado: jest.fn(),
  findAllSinSistemaFor: jest.fn(),
  findAllSistemaFor: jest.fn(),
  remove: jest.fn(),
  findByDenominacionWith: jest.fn(),
};

const mockUsuarioService = {
  findOne: jest.fn(),
};

const mockPoliticaEliminacionMarca = {
  tieneProductosActivosParaMarca: jest.fn(),
};

describe('MarcaService', () => {
  let service: MarcaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarcaService,
        { provide: 'IMarcaRepository', useValue: mockRepository },
        { provide: UsuarioService, useValue: mockUsuarioService },
        { provide: PoliticaEliminacionMarca, useValue: mockPoliticaEliminacionMarca },
      ],
    }).compile();

    service = module.get<MarcaService>(MarcaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('rechaza una denominación ya usada por otra Marca', async () => {
      mockRepository.findByDenominacionWith.mockResolvedValue({ id: 2 });

      await expect(
        service.create({ denominacion: 'COCA-COLA' } as any),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('crea la Marca cuando la denominación está disponible', async () => {
      const dto = { denominacion: 'COCA-COLA' };
      mockRepository.findByDenominacionWith.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue({ id: 1, ...dto });

      await expect(service.create(dto as any)).resolves.toBeDefined();
      expect(mockRepository.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('update', () => {
    it('no permite modificar una Marca de sistema', async () => {
      mockRepository.findOne.mockResolvedValue({ id: 1, sistema: 1 });

      await expect(
        service.update(1, { denominacion: 'NUEVA' } as any),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('rechaza cambiar a una denominación ya usada', async () => {
      mockRepository.findOne.mockResolvedValue({ id: 1, sistema: 0 });
      mockRepository.findByDenominacionWith.mockResolvedValue({ id: 2 });

      await expect(
        service.update(1, { denominacion: 'NUEVA' } as any),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    const marca = { id: 1, denominacion: 'COCA-COLA', sistema: 0 };

    it('rechaza eliminar una Marca de sistema', async () => {
      mockRepository.findOne.mockResolvedValue({ ...marca, sistema: 1 });

      await expect(service.remove(1, 7)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(mockPoliticaEliminacionMarca.tieneProductosActivosParaMarca).not.toHaveBeenCalled();
    });

    it('rechaza eliminar una Marca asociada a productos activos', async () => {
      mockRepository.findOne.mockResolvedValue(marca);
      mockPoliticaEliminacionMarca.tieneProductosActivosParaMarca.mockResolvedValue(true);

      await expect(service.remove(1, 7)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(mockUsuarioService.findOne).not.toHaveBeenCalled();
      expect(mockRepository.remove).not.toHaveBeenCalled();
    });

    it('rechaza eliminar si el usuario auditor no existe', async () => {
      mockRepository.findOne.mockResolvedValue(marca);
      mockPoliticaEliminacionMarca.tieneProductosActivosParaMarca.mockResolvedValue(false);
      mockUsuarioService.findOne.mockResolvedValue(null);

      await expect(service.remove(1, 7)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(mockRepository.remove).not.toHaveBeenCalled();
    });

    it('elimina una Marca sin productos activos y registra el usuario', async () => {
      const usuario = { id: 7 };
      mockRepository.findOne.mockResolvedValue(marca);
      mockPoliticaEliminacionMarca.tieneProductosActivosParaMarca.mockResolvedValue(false);
      mockUsuarioService.findOne.mockResolvedValue(usuario);

      await expect(service.remove(1, 7)).resolves.toBeDefined();
      expect(mockRepository.remove).toHaveBeenCalledWith(marca, usuario);
    });
  });
});
