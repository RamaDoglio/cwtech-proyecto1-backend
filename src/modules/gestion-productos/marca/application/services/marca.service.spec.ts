import { Test, TestingModule } from '@nestjs/testing';
import { MarcaService } from './marca.service';
import { IMarcaRepository } from '../../domain/interfaces/marca.repository.interface';
import { UsuarioService } from '../../../../gestion-usuario/usuario/application/services/usuario.service';
import { PoliticaEliminacionMarca } from '../../domain/services/politica-eliminacion-marca.service';

// ==================== MOCKS ====================

const mockRepository = {
  create: jest.fn(),
  update: jest.fn(),
  findOne: jest.fn(),
  findBy: jest.fn(),
  findByIdConAuditoria: jest.fn(),
  findAllFor: jest.fn(),
  findAllListado: jest.fn(),
  findAllSinSistemaFor: jest.fn(),
  findAllSistemaFor: jest.fn(),
  remove: jest.fn(),
  findByDenominacionWith: jest.fn(),
};

const mockUsuarioService = {
  findOne: jest.fn(),
};

const mockPoliticaEliminacionMarca = {
  tieneProductosActivosParaMarca: jest.fn(),
};

describe('MarcaService', () => {
  let service: MarcaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarcaService,
        { provide: 'IMarcaRepository', useValue: mockRepository },
        { provide: UsuarioService, useValue: mockUsuarioService },
        { provide: PoliticaEliminacionMarca, useValue: mockPoliticaEliminacionMarca },
      ],
    }).compile();

    service = module.get<MarcaService>(MarcaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});