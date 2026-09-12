import { Test, TestingModule } from '@nestjs/testing';
import { ConfiguracionSistemaService } from './configuracion-sistema.service';
import { IConfiguracionSistemaRepository } from '../../domain/interfaces/configuracion-sistema.repository.interface';

// ==================== MOCK DEL REPOSITORIO ====================
const mockConfiguracionSistemaRepository = {
  findOne: jest.fn(),
  // si el servicio usa otros métodos, añádelos aquí
};

describe('ConfiguracionSistemaService', () => {
  let service: ConfiguracionSistemaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfiguracionSistemaService,
        {
          provide: 'IConfiguracionSistemaRepository',
          useValue: mockConfiguracionSistemaRepository,
        },
      ],
    }).compile();

    service = module.get<ConfiguracionSistemaService>(ConfiguracionSistemaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});