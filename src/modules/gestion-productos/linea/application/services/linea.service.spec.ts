import { Test, TestingModule } from '@nestjs/testing';
import { LineaService } from './linea.service';
import { ILineaRepository } from '../../domain/interfaces/linea.repository.interface';
import { PoliticaEliminacionLinea } from '../../domain/services/politica-eliminacion-linea.service';
import { UsuarioService } from '../../../../gestion-usuario/usuario/application/services/usuario.service';

// ==================== MOCKS ====================

const mockRepository = {
  create: jest.fn(),
  update: jest.fn(),
  findOne: jest.fn(),
  findByDenominacionFiltered: jest.fn(),
  findByIdConAuditoria: jest.fn(),
  findAllFor: jest.fn(),
  remove: jest.fn(),
  findByDenominacionWith: jest.fn(),
  findAllListado: jest.fn(),
};

const mockPoliticaEliminacionLinea = {
  tieneProductosActivosParaLinea: jest.fn(),
};

const mockUsuarioService = {
  findOne: jest.fn(),
};

describe('LineaService', () => {
  let service: LineaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LineaService,
        { provide: 'ILineaRepository', useValue: mockRepository },
        { provide: PoliticaEliminacionLinea, useValue: mockPoliticaEliminacionLinea },
        { provide: UsuarioService, useValue: mockUsuarioService },
      ],
    }).compile();

    service = module.get<LineaService>(LineaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});