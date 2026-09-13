import { Test, TestingModule } from '@nestjs/testing';
import { UsuarioService } from './usuario.service';
import { IUsuarioRepository } from '../../domain/interfaces/usuario-repository.interface';
import { RolService } from '../../../rol/application/services/rol.service';

// ==================== MOCKS ====================
const mockUsuarioRepository = {
  findOne: jest.fn(),
  findByMail: jest.fn(),
  findBy: jest.fn(),
  findAll: jest.fn(),
  updateDatos: jest.fn(),
  create: jest.fn(),
  createUsuarioFor: jest.fn(),
  remove: jest.fn(),
  findByMailFiltered: jest.fn(),
  save: jest.fn(),
  updateContrasena: jest.fn(),
};

const mockRolService = {
  findOne: jest.fn(),
  findByIds: jest.fn(),
};

describe('UsuarioService', () => {
  let service: UsuarioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuarioService,
        { provide: 'IUsuarioRepository', useValue: mockUsuarioRepository },
        { provide: RolService, useValue: mockRolService },
      ],
    }).compile();

    service = module.get<UsuarioService>(UsuarioService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});