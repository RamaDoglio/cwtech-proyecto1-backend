import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsuarioService } from '../../../usuario/application/services/usuario.service';
import { ConfigService } from '@nestjs/config';

// ==================== MOCKS ====================
const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-token'),
};

const mockUsuarioService = {
  create: jest.fn(),
  findByMail: jest.fn(),
  save: jest.fn(),
};

const mockConfigService = {
  get: jest.fn().mockImplementation((key: string) => {
    if (key === 'JWT_EXPIRATION_ACCESS') return '60s';
    if (key === 'JWT_EXPIRATION_REFRESH') return '7d';
    if (key === 'GOOGLE_CLIENT_ID') return 'mock-google-client-id';
    return null;
  }),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: UsuarioService, useValue: mockUsuarioService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});