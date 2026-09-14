// Mockear @nestjs/mapped-types para evitar el error de ESM/CJS
jest.mock('@nestjs/mapped-types', () => ({
  PartialType: () => class {},
  OmitType: () => class {},
  IntersectionType: () => class {},
  PickType: () => class {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { ProvinciaController } from './provincia.controller';
import { ProvinciaService } from '../services/provincia.service';
import { AuthGuard } from 'src/modules/gestion-usuario/auth/auth.guard';

const mockProvinciaService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findByDenominacionFiltered: jest.fn(),
  findAllFor: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('ProvinciaController', () => {
  let controller: ProvinciaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProvinciaController],
      providers: [{ provide: ProvinciaService, useValue: mockProvinciaService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ProvinciaController>(ProvinciaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});