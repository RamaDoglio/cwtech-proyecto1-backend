import { Test, TestingModule } from '@nestjs/testing';
import { PersonalController } from './personal.controller';
import { PersonalService } from '../services/personal.service';

// ==================== MOCK DEL SERVICIO ====================
const mockPersonalService = {
  create: jest.fn(),
  findBy: jest.fn(),
  findDtoById: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  findByIdConAuditoria: jest.fn(),
};

describe('PersonalController', () => {
  let controller: PersonalController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PersonalController],
      providers: [{ provide: PersonalService, useValue: mockPersonalService }],
    }).compile();

    controller = module.get<PersonalController>(PersonalController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});