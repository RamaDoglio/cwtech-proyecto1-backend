import { Test, TestingModule } from '@nestjs/testing';
import { PersonalService } from './personal.service';
import { IPersonalRepository } from '../../domain/interfaces/personal.interface';
import { UsuarioService } from 'src/modules/gestion-usuario/usuario/application/services/usuario.service';

// ==================== MOCKS ====================
const mockPersonalRepository = {
  create: jest.fn(),
  update: jest.fn(),
  findBy: jest.fn(),
  findByIdConAuditoria: jest.fn(),
  findOne: jest.fn(),
  findAllFor: jest.fn(),
  findAllVendedorFor: jest.fn(),
  remove: jest.fn(),
  findByDenominacion: jest.fn(),
  findAllListado: jest.fn(),
};

const mockUsuarioService = {
  findOne: jest.fn(),
};

describe('PersonalService', () => {
  let service: PersonalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersonalService,
        { provide: 'IPersonalRepository', useValue: mockPersonalRepository },
        { provide: UsuarioService, useValue: mockUsuarioService },
      ],
    }).compile();

    service = module.get<PersonalService>(PersonalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});