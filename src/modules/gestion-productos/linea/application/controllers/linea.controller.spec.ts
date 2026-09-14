// Mockear @nestjs/mapped-types para evitar el error de ESM/CJS
jest.mock('@nestjs/mapped-types', () => ({
  PartialType: () => class {},
  OmitType: () => class {},
  IntersectionType: () => class {},
  PickType: () => class {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { LineaController } from './linea.controller';
import { LineaService } from '../services/linea.service';
import { AuthGuard } from 'src/modules/gestion-usuario/auth/auth.guard';

// ==================== MOCK DEL SERVICIO ====================
const mockLineaService = {
  findByDenominacionFiltered: jest.fn(),
  findDtoById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  findByIdConAuditoria: jest.fn(),
};

describe('LineaController', () => {
  let controller: LineaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LineaController],
      providers: [{ provide: LineaService, useValue: mockLineaService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<LineaController>(LineaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});