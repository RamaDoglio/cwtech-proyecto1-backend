import { Test, TestingModule } from '@nestjs/testing';
import { LocalidadController } from './localidad.controller';
import { LocalidadService } from '../services/localidad.service';

const mockLocalidadService = {
  create: jest.fn(),
  findBy: jest.fn(),
  findDtoById: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  findAllProvincia: jest.fn(),
  findByIdConAuditoria: jest.fn(),
};

describe('LocalidadController', () => {
  let controller: LocalidadController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocalidadController],
      providers: [{ provide: LocalidadService, useValue: mockLocalidadService }],
    }).compile();

    controller = module.get<LocalidadController>(LocalidadController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});