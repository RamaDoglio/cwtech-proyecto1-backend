import { Test, TestingModule } from '@nestjs/testing';
import { LineaController } from './linea.controller';
import { LineaService } from '../services/linea.service';

// ==================== MOCKS ====================

const mockLineaService = {
  findByDenominacionFiltered: jest.fn(),
  findDtoById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  findByIdConAuditoria: jest.fn(),
};

describe('LineaController', () => {
  let controller: LineaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LineaController],
      providers: [
        { provide: LineaService, useValue: mockLineaService },
      ],
    }).compile();

    controller = module.get<LineaController>(LineaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});