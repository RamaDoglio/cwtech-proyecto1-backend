import { Test, TestingModule } from '@nestjs/testing';
import { MarcaController } from './marca.controller';
import { MarcaService } from '../services/marca.service';

// ==================== MOCK DEL SERVICIO ====================
const mockMarcaService = {
  findBy: jest.fn(),
  findDtoById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  findByIdConAuditoria: jest.fn(),
};

describe('MarcaController', () => {
  let controller: MarcaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MarcaController],
      providers: [{ provide: MarcaService, useValue: mockMarcaService }],
    }).compile();

    controller = module.get<MarcaController>(MarcaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Puedes conservar los tests específicos que tenías, adaptando los nombres
  describe('findByDenominacionFiltered', () => {
    it('debería llamar a service.findBy con los parámetros correctos', async () => {
      const dto = { denominacion: 'PRUEBA', skip: 0, take: 10, incluirEliminados: false };
      const result = [{ id: 1, denominacion: 'PRUEBA' }];
      mockMarcaService.findBy.mockResolvedValue(result);

      const response = await controller.findByDenominacionFiltered(dto as any);
      expect(mockMarcaService.findBy).toHaveBeenCalledWith('PRUEBA', 0, 10, false);
      expect(response).toBe(result);
    });

    it('debería usar cadena vacía si denominacion no está definido', async () => {
      const dto = { skip: 0, take: 10 };
      const result: any[] = [];
      mockMarcaService.findBy.mockResolvedValue(result);

      const response = await controller.findByDenominacionFiltered(dto as any);
      expect(mockMarcaService.findBy).toHaveBeenCalledWith('', 0, 10, undefined);
      expect(response).toBe(result);
    });

    it('debería propagar errores si el service falla', async () => {
      mockMarcaService.findBy.mockRejectedValue(new Error('Fallo del service'));

      await expect(
        controller.findByDenominacionFiltered({ denominacion: 'algo', skip: 0, take: 10 } as any),
      ).rejects.toThrow('Fallo del service');
    });
  });

  describe('findOne', () => {
    it('debería llamar a service.findDtoById con el id correcto', async () => {
      const result = { id: 1, denominacion: 'MARCA TEST' };
      mockMarcaService.findDtoById.mockResolvedValue(result);

      const response = await controller.findOne(1);
      expect(mockMarcaService.findDtoById).toHaveBeenCalledWith(1);
      expect(response).toBe(result);
    });
  });

  describe('create', () => {
    it('debería llamar a service.create y retornar el resultado', async () => {
      const createDto = { denominacion: 'NUEVA MARCA', observacion: 'test', usuarioCreatedId: 1 };
      const result = { id: 1, ...createDto };
      mockMarcaService.create.mockResolvedValue(result);

      const response = await controller.create(createDto as any);
      expect(mockMarcaService.create).toHaveBeenCalledWith(createDto);
      expect(response).toBe(result);
    });
  });

  describe('update', () => {
    it('debería llamar a service.update con id y dto', async () => {
      const updateDto = { denominacion: 'MARCA ACTUALIZADA', usuarioUpdatedId: 1, updatedAt: new Date() };
      const result = { id: 1, ...updateDto };
      mockMarcaService.update.mockResolvedValue(result);

      const response = await controller.update(1, updateDto as any);
      expect(mockMarcaService.update).toHaveBeenCalledWith(1, updateDto);
      expect(response).toBe(result);
    });
  });

  describe('remove', () => {
    it('debería llamar a service.remove con id y usuarioId', async () => {
      mockMarcaService.remove.mockResolvedValue({ affected: 1 });

      const response = await controller.remove(1, 5);
      expect(mockMarcaService.remove).toHaveBeenCalledWith(1, 5);
      expect(response).toEqual({ affected: 1 });
    });
  });

  describe('findByIdConAuditoria', () => {
    it('debería llamar a service.findByIdConAuditoria', async () => {
      const result = { id: 1, createdAt: new Date(), updatedAt: new Date() };
      mockMarcaService.findByIdConAuditoria.mockResolvedValue(result);

      const response = await controller.findByIdConAuditoria(1);
      expect(mockMarcaService.findByIdConAuditoria).toHaveBeenCalledWith(1);
      expect(response).toBe(result);
    });
  });
});