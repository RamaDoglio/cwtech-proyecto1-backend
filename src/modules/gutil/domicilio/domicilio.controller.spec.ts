import { Test, TestingModule } from '@nestjs/testing';
import { DomicilioController } from './domicilio.controller';
import { DomicilioService } from './domicilio.service';

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
    }).compile();

    controller = module.get<DomicilioController>(DomicilioController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});