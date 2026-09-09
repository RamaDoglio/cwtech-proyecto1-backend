import { Test, TestingModule } from '@nestjs/testing';
import { ProvinciaService } from './provincia.service';
import { IProvinciaRepository } from '../../domain/interfaces/provincia.repository.interface';

// ==================== MOCK DEL REPOSITORIO ====================
const mockProvinciaRepository = {
  create: jest.fn(),
  update: jest.fn(),
  findAll: jest.fn(),
  findByDenominacionFiltered: jest.fn(),
  findAllFor: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  findByDenominacion: jest.fn(),
};

describe('ProvinciaService', () => {
  let service: ProvinciaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProvinciaService,
        { provide: 'IProvinciaRepository', useValue: mockProvinciaRepository },
      ],
    }).compile();

    service = module.get<ProvinciaService>(ProvinciaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});