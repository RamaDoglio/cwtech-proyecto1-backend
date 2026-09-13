import { Test, TestingModule } from '@nestjs/testing';
import { RolService } from './rol.service';
import { IRolRepository } from '../../domain/interfaces/rol-repository.interface';

// ==================== MOCK DEL REPOSITORIO ====================
const mockRolRepository = {
  create: jest.fn(),
  update: jest.fn(),
  findAll: jest.fn(),
  findByDenominacionFiltered: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  findByDenominacion: jest.fn(),
  findByIds: jest.fn(),
};

describe('RolService', () => {
  let service: RolService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolService,
        { provide: 'IRolRepository', useValue: mockRolRepository },
      ],
    }).compile();

    service = module.get<RolService>(RolService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});