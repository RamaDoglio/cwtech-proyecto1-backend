import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UsuarioService } from '../../../../gestion-usuario/usuario/application/services/usuario.service';
import { EnvasePresentacion } from '../../domain/entities/envase-presentacion.entity';
import { PoliticaEliminacionEnvasePresentacion } from '../../domain/services/politica-eliminacion-envase-presentacion.service';
import { EnvasePresentacionService } from './envase-presentacion.service';

const mockRepository = {
  create: jest.fn(),
  update: jest.fn(),
  findOne: jest.fn(),
  findAllFor: jest.fn(),
  findBy: jest.fn(),
  findByDenominacionWith: jest.fn(),
  findByIdConAuditoria: jest.fn(),
  remove: jest.fn(),
};
const mockUsuarioService = { findOne: jest.fn() };
const mockPolitica = { tieneProductosActivos: jest.fn() };

const envase = (columnas: Partial<EnvasePresentacion> = {}) =>
  Object.assign(new EnvasePresentacion(), {
    id: 1,
    denominacion: 'BOTELLA',
    sistema: 0,
    ...columnas,
  });

describe('EnvasePresentacionService', () => {
  let service: EnvasePresentacionService;

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnvasePresentacionService,
        { provide: 'IEnvasePresentacionRepository', useValue: mockRepository },
        { provide: UsuarioService, useValue: mockUsuarioService },
        { provide: PoliticaEliminacionEnvasePresentacion, useValue: mockPolitica },
      ],
    }).compile();

    service = module.get(EnvasePresentacionService);
  });

  describe('alta', () => {
    it('crea el envase si la denominación está libre', async () => {
      mockRepository.findByDenominacionWith.mockResolvedValue(null);
      mockRepository.create.mockImplementation(async (dto) => envase(dto));

      await service.create({ denominacion: 'BOTELLA', usuarioCreatedId: 1 });

      expect(mockRepository.create).toHaveBeenCalledWith({
        denominacion: 'BOTELLA',
        usuarioCreatedId: 1,
      });
    });

    it('rechaza una denominación en uso, aunque sea de un envase eliminado', async () => {
      mockRepository.findByDenominacionWith.mockResolvedValue(
        envase({ id: 7, deletedAt: new Date() }),
      );

      await expect(
        service.create({ denominacion: 'BOTELLA', usuarioCreatedId: 1 }),
      ).rejects.toThrow(ConflictException);
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('modificación', () => {
    it('permite conservar la propia denominación', async () => {
      mockRepository.findOne.mockResolvedValue(envase());
      mockRepository.findByDenominacionWith.mockResolvedValue(envase());
      mockRepository.update.mockResolvedValue(envase({ observacion: 'vidrio' }));

      await service.update(1, {
        denominacion: 'BOTELLA',
        observacion: 'vidrio',
        usuarioUpdatedId: 1,
      });

      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('rechaza la denominación de otro envase', async () => {
      mockRepository.findOne.mockResolvedValue(envase());
      mockRepository.findByDenominacionWith.mockResolvedValue(envase({ id: 2 }));

      await expect(
        service.update(1, { denominacion: 'BOLSA', usuarioUpdatedId: 1 }),
      ).rejects.toThrow(ConflictException);
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('no deja modificar un envase de sistema', async () => {
      mockRepository.findOne.mockResolvedValue(envase({ sistema: 1 }));

      await expect(
        service.update(1, { denominacion: 'OTRO', usuarioUpdatedId: 1 }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('baja', () => {
    it('no deja eliminar un envase usado por productos activos', async () => {
      mockRepository.findOne.mockResolvedValue(envase());
      mockPolitica.tieneProductosActivos.mockResolvedValue(true);

      await expect(service.remove(1, 1)).rejects.toThrow(ConflictException);
      expect(mockRepository.remove).not.toHaveBeenCalled();
    });

    it('elimina un envase sin productos activos', async () => {
      const botella = envase();
      mockRepository.findOne.mockResolvedValue(botella);
      mockPolitica.tieneProductosActivos.mockResolvedValue(false);
      mockUsuarioService.findOne.mockResolvedValue({ id: 1 });

      await service.remove(1, 1);

      expect(mockRepository.remove).toHaveBeenCalledWith(botella, { id: 1 });
    });
  });

  describe('consulta', () => {
    it('responde 404 si el envase no existe o está eliminado', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findEntityById(99)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('devuelve los envases activos para el selector', async () => {
      mockRepository.findAllFor.mockResolvedValue([
        envase(),
        envase({ id: 2, denominacion: 'BOLSA' }),
      ]);

      const resultado = await service.findAllFor('');

      expect(resultado.total).toBe(2);
      expect(resultado.data.map((e) => e.denominacion)).toEqual([
        'BOTELLA',
        'BOLSA',
      ]);
    });
  });
});
