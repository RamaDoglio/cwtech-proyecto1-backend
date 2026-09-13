// Mockear @nestjs/mapped-types para evitar el error de ESM/CJS
jest.mock('@nestjs/mapped-types', () => ({
  PartialType: () => class {},
  OmitType: () => class {},
  IntersectionType: () => class {},
  PickType: () => class {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { DomicilioController } from './domicilio.controller';
import { DomicilioService } from './domicilio.service';
import { AuthGuard } from 'src/modules/gestion-usuario/auth/auth.guard';

const mockDomicilioService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('DomicilioController', () => {
  let controller: DomicilioController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DomicilioController],
      providers: [{ provide: DomicilioService, useValue: mockDomicilioService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<DomicilioController>(DomicilioController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});