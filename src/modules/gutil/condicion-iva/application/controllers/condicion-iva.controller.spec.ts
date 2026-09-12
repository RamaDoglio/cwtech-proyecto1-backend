import { Test, TestingModule } from '@nestjs/testing';
import { CondicionIvaController } from './condicion-iva.controller';
import { CondicionIvaService } from '../services/condicion-iva.service';

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
    }).compile();

    controller = module.get<CondicionIvaController>(CondicionIvaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});