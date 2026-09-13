import { Test, TestingModule } from '@nestjs/testing';
import { UsuarioController } from './usuario.controller';
import { UsuarioService } from '../services/usuario.service';
import { AuthGuard } from '../../../auth/auth.guard';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { IUsuarioRepository } from '../../domain/interfaces/usuario-repository.interface';

// Mocks para el guard
const mockJwtService = { sign: jest.fn(), verify: jest.fn() };
const mockReflector = { get: jest.fn() };
const mockConfigService = { get: jest.fn() };
const mockUsuarioRepository = { /* métodos */ };

// Mock del servicio
const mockUsuarioService = {
  findBy: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  findByMailFiltered: jest.fn(),
  updateContrasena: jest.fn(),
  updateDatos: jest.fn(),
  remove: jest.fn(),
};

describe('UsuarioController', () => {
  let controller: UsuarioController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsuarioController],
      providers: [
        { provide: UsuarioService, useValue: mockUsuarioService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: Reflector, useValue: mockReflector },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: 'IUsuarioRepository', useValue: mockUsuarioRepository },
      ],
    })
      // Opcional: override del guard para evitar que se instancie con dependencias reales
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<UsuarioController>(UsuarioController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});