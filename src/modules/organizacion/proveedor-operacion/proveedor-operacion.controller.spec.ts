import { Test, TestingModule } from '@nestjs/testing';
import { ProveedorOperacionController } from './proveedor-operacion.controller';
import { ProveedorOperacionService } from './proveedor-operacion.service';

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
    }).compile();

    controller = module.get<ProveedorOperacionController>(ProveedorOperacionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});