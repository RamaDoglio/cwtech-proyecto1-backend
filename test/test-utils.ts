import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, CanActivate } from '@nestjs/common';
import { AuthGuard } from 'src/modules/gestion-usuario/auth/auth.guard';

export interface MockProvider<T> {
  provide: any;
  useValue: Partial<T>;
}

export interface TestingModuleOptions {
  imports?: any[];
  controllers?: any[];
  providers?: (any | MockProvider<any>)[];
  mocks?: Record<string, any>;
  overrideGuards?: any[];
  overrideProviders?: MockProvider<any>[];
}

export interface BuiltTestingModule {
  module: TestingModule;
  app: INestApplication;
  get: <T>(token: any) => T;
  mocks: Record<string, any>;
  close: () => Promise<void>;
}

const createMockAuthGuard = (): CanActivate => ({
  canActivate: (context: ExecutionContext): boolean => {
    const request = context.switchToHttp().getRequest();
    request.user = {
      sub: 1,
      personalId: 1,
      roles: [1],
      empresaId: 1,
      puntoVentaId: 1,
    };
    return true;
  },
});

const createMockJwtService = (): Partial<JwtService> => ({
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn().mockReturnValue({
    sub: 1,
    personalId: 1,
    roles: [1],
    empresaId: 1,
    puntoVentaId: 1,
  }),
  decode: jest.fn().mockReturnValue({
    sub: 1,
    personalId: 1,
    roles: [1],
    empresaId: 1,
    puntoVentaId: 1,
  }),
});

const createMockConfigService = (): Partial<ConfigService> => ({
  get: jest.fn((key: string) => {
    const config: Record<string, any> = {
      JWT_SECRET: 'test-secret',
      JWT_EXPIRATION_ACCESS: '3600',
      JWT_EXPIRATION_REFRESH: '7d',
      GOOGLE_CLIENT_ID: 'test-client-id',
      DB_HOST: 'localhost',
      DB_PORT: 3306,
      DB_USERNAME: 'test',
      DB_PASSWORD: 'test',
      DB_DATABASE: 'test',
      EMAIL_USER: 'test@test.com',
      EMAIL_PASS: 'test-pass',
    };
    return config[key];
  }),
});

const createMockReflector = (): Partial<Reflector> => ({
  get: jest.fn().mockReturnValue(undefined),
  getAllAndOverride: jest.fn().mockReturnValue(undefined),
  getAllAndMerge: jest.fn().mockReturnValue([]),
});

export const buildTestingModule = async (options: TestingModuleOptions = {}): Promise<BuiltTestingModule> => {
  const {
    imports = [],
    controllers = [],
    providers = [],
    mocks = {},
    overrideGuards = [AuthGuard],
    overrideProviders = [],
  } = options;

  const mockProviders = [
    { provide: JwtService, useValue: createMockJwtService() },
    { provide: ConfigService, useValue: createMockConfigService() },
    { provide: Reflector, useValue: createMockReflector() },
    ...overrideProviders,
    ...Object.entries(mocks).map(([token, value]) => ({ provide: token, useValue: value })),
  ];

  const moduleBuilder = Test.createTestingModule({
    imports,
    controllers,
    providers: [...providers, ...mockProviders],
  });

  for (const guard of overrideGuards) {
    moduleBuilder.overrideGuard(guard).useValue(createMockAuthGuard());
  }

  const module: TestingModule = await moduleBuilder.compile();
  const app = module.createNestApplication();
  await app.init();

  const get = <T>(token: any): T => module.get<T>(token);

  const allMocks = {
    jwtService: get(JwtService),
    configService: get(ConfigService),
    reflector: get(Reflector),
    ...mocks,
  };

  return {
    module,
    app,
    get,
    mocks: allMocks,
    close: async () => {
      await app.close();
    },
  };
};

export const createTestingModuleFor = async <T>(
  moduleClass: any,
  options: Omit<TestingModuleOptions, 'imports'> & { imports?: any[] } = {}
): Promise<BuiltTestingModule> => {
  return buildTestingModule({
    ...options,
    imports: [moduleClass, ...(options.imports || [])],
  });
};