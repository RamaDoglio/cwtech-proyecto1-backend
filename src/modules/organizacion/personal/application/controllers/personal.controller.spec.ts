// Mockear @nestjs/mapped-types para evitar el error de ESM/CJS
jest.mock('@nestjs/mapped-types', () => ({
  PartialType: () => class {},
  OmitType: () => class {},
  IntersectionType: () => class {},
  PickType: () => class {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { PersonalController } from './personal.controller';
import { PersonalService } from '../services/personal.service';
import { AuthGuard } from 'src/modules/gestion-usuario/auth/auth.guard';

// ==================== MOCK DEL SERVICIO ====================
const mockPersonalService = {
  create: jest.fn(),
  findBy: jest.fn(),
  findDtoById: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  findByIdConAuditoria: jest.fn(),
};

describe('PersonalController', () => {
  let controller: PersonalController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PersonalController],
      providers: [{ provide: PersonalService, useValue: mockPersonalService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<PersonalController>(PersonalController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});