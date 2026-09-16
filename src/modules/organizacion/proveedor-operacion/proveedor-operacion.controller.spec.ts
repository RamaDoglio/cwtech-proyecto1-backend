// Mockear @nestjs/mapped-types para evitar el error de ESM/CJS
jest.mock('@nestjs/mapped-types', () => ({
  PartialType: () => class {},
  OmitType: () => class {},
  IntersectionType: () => class {},
  PickType: () => class {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { ProveedorOperacionController } from './proveedor-operacion.controller';
import { ProveedorOperacionService } from './proveedor-operacion.service';
import { AuthGuard } from 'src/modules/gestion-usuario/auth/auth.guard';

const mockProveedorOperacionService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('ProveedorOperacionController', () => {
  let controller: ProveedorOperacionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProveedorOperacionController],
      providers: [{ provide: ProveedorOperacionService, useValue: mockProveedorOperacionService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ProveedorOperacionController>(ProveedorOperacionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});