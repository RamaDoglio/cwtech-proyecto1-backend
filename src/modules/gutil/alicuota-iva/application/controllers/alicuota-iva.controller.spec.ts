import { Test, TestingModule } from '@nestjs/testing';
import { AlicuotaIvaController } from './alicuota-iva.controller';
import { AlicuotaIvaService } from '../services/alicuota-iva.service';

// ==================== MOCK DEL SERVICIO ====================
const mockAlicuotaIvaService = {
  create: jest.fn(),
  findBy: jest.fn(),
  findDtoById: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  findByIdConAuditoria: jest.fn(),
};

describe('AlicuotaIvaController', () => {
  let controller: AlicuotaIvaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlicuotaIvaController],
      providers: [{ provide: AlicuotaIvaService, useValue: mockAlicuotaIvaService }],
    }).compile();

    controller = module.get<AlicuotaIvaController>(AlicuotaIvaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});