import { Test, TestingModule } from '@nestjs/testing';
import { EmpresaService } from './empresa.service';
import { IEmpresaRepository } from '../../domain/interfaces/empresa.interface';
import { CondicionIvaService } from 'src/modules/gutil/condicion-iva/application/services/condicion-iva.service';

// ==================== MOCKS ====================
const mockEmpresaRepository = {
  create: jest.fn(),
  update: jest.fn(),
  findAll: jest.fn(),
  findByDenominacionFiltered: jest.fn(),
  findOne: jest.fn(),
  findOneWithRelations: jest.fn(),
  remove: jest.fn(),
  findByDenominacion: jest.fn(),
  empresaExist: jest.fn(),
};

const mockCondicionIvaService = {
  findEntityById: jest.fn(),
  // si tiene otros métodos que use el servicio, añádelos aquí
};

describe('EmpresaService', () => {
  let service: EmpresaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmpresaService,
        { provide: 'IEmpresaRepository', useValue: mockEmpresaRepository },
        { provide: CondicionIvaService, useValue: mockCondicionIvaService },
      ],
    }).compile();

    service = module.get<EmpresaService>(EmpresaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});