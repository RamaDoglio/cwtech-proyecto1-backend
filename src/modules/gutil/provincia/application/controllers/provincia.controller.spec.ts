import { Test, TestingModule } from '@nestjs/testing';
import { ProvinciaController } from './provincia.controller';
import { ProvinciaService } from '../services/provincia.service';

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
    }).compile();

    controller = module.get<ProvinciaController>(ProvinciaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});