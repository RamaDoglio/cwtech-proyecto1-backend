// Mockear @nestjs/mapped-types para evitar el error de ESM/CJS
jest.mock('@nestjs/mapped-types', () => ({
  PartialType: () => class {},
  OmitType: () => class {},
  IntersectionType: () => class {},
  PickType: () => class {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { CondicionIvaController } from './condicion-iva.controller';
import { CondicionIvaService } from '../services/condicion-iva.service';
import { AuthGuard } from 'src/modules/gestion-usuario/auth/auth.guard';

// ==================== MOCK DEL SERVICIO ====================
const mockCondicionIvaService = {
  create: jest.fn(),
  findByDenominacionFiltered: jest.fn(),
  findAllFor: jest.fn(),
  findDtoById: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  findByIdConAuditoria: jest.fn(),
};

describe('CondicionIvaController', () => {
  let controller: CondicionIvaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CondicionIvaController],
      providers: [{ provide: CondicionIvaService, useValue: mockCondicionIvaService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<CondicionIvaController>(CondicionIvaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});