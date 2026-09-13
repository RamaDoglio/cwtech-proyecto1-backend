import { Test, TestingModule } from '@nestjs/testing';
import { CondicionIvaService } from './condicion-iva.service';
import { ICondicionIvaRepository } from '../../domain/interfaces/condicion-iva.repository.interface';

// ==================== MOCK DEL REPOSITORIO ====================
const mockCondicionIvaRepository = {
  create: jest.fn(),
  update: jest.fn(),
  findOne: jest.fn(),
  findByDenominacionFiltered: jest.fn(),
  findAllFor: jest.fn(),
  remove: jest.fn(),
  findByDenominacion: jest.fn(),
  findAllListado: jest.fn(),
  findByIdConAuditoria: jest.fn(),
};

describe('CondicionIvaService', () => {
  let service: CondicionIvaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CondicionIvaService,
        {
          provide: 'ICondicionIvaRepository',
          useValue: mockCondicionIvaRepository,
        },
      ],
    }).compile();

    service = module.get<CondicionIvaService>(CondicionIvaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});