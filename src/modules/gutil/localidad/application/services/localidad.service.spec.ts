import { Test, TestingModule } from '@nestjs/testing';
import { LocalidadService } from './localidad.service';
import { ILocalidadRepository } from '../../domain/interfaces/localidad.repository.interface';
import { ProvinciaService } from '../../../provincia/application/services/provincia.service';

// ==================== MOCKS ====================
const mockLocalidadRepository = {
  create: jest.fn(),
  update: jest.fn(),
  findOne: jest.fn(),
  findBy: jest.fn(),
  findAllFor: jest.fn(),
  findAllForProvincia: jest.fn(),
  remove: jest.fn(),
  findByDenominacion: jest.fn(),
  findByIdConAuditoria: jest.fn(),
  findAllListado: jest.fn(),
};

const mockProvinciaService = {
  findOne: jest.fn(),
  findAllFor: jest.fn(),
};

describe('LocalidadService', () => {
  let service: LocalidadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalidadService,
        { provide: 'ILocalidadRepository', useValue: mockLocalidadRepository },
        { provide: ProvinciaService, useValue: mockProvinciaService },
      ],
    }).compile();

    service = module.get<LocalidadService>(LocalidadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});