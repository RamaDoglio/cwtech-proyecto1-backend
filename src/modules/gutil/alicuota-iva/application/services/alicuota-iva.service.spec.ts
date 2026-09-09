import { Test, TestingModule } from '@nestjs/testing';
import { AlicuotaIvaService } from './alicuota-iva.service';
import { IAlicuotaIvaRepository } from '../../domain/interfaces/alicuota-iva.repository.interface';
import { UsuarioService } from '../../../../gestion-usuario/usuario/application/services/usuario.service';

// ==================== MOCKS ====================
const mockAlicuotaIvaRepository = {
  create: jest.fn(),
  update: jest.fn(),
  findOne: jest.fn(),
  findBy: jest.fn(),
  findAllFor: jest.fn(),
  findAllSinSistemaFor: jest.fn(),
  findAllSistemaFor: jest.fn(),
  remove: jest.fn(),
  findByDenominacionWith: jest.fn(),
  findByIdConAuditoria: jest.fn(),
};

const mockUsuarioService = {
  findOne: jest.fn(),
};

describe('AlicuotaIvaService', () => {
  let service: AlicuotaIvaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlicuotaIvaService,
        { provide: 'IAlicuotaIvaRepository', useValue: mockAlicuotaIvaRepository },
        { provide: UsuarioService, useValue: mockUsuarioService },
      ],
    }).compile();

    service = module.get<AlicuotaIvaService>(AlicuotaIvaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});