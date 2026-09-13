import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

let testDataSource: DataSource | null = null;

export const getTestDataSource = (): DataSource | null => testDataSource;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
  process.env.JWT_EXPIRATION_ACCESS = '3600';
  process.env.JWT_EXPIRATION_REFRESH = '7d';
  process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
  process.env.DB_TYPE = 'sqlite';
  process.env.DB_DATABASE = ':memory:';
  process.env.DB_SYNCHRONIZE = 'true';
  process.env.DB_LOGGING = 'false';
});

afterAll(async () => {
  if (testDataSource && testDataSource.isInitialized) {
    await testDataSource.destroy();
    testDataSource = null;
  }
  await new Promise((resolve) => setTimeout(resolve, 500));
});

export const closeTestDataSource = async (): Promise<void> => {
  if (testDataSource && testDataSource.isInitialized) {
    await testDataSource.destroy();
    testDataSource = null;
  }
};

export const initializeTestDataSource = async (configService: ConfigService): Promise<DataSource> => {
  if (testDataSource && testDataSource.isInitialized) {
    return testDataSource;
  }

  const { DataSource } = await import('typeorm');
  const entities = await import('../src/index').then((m) => Object.values(m).filter((e) => typeof e === 'function'));

  testDataSource = new DataSource({
    type: 'sqlite',
    database: ':memory:',
    synchronize: true,
    logging: false,
    entities: entities as any[],
  });

  await testDataSource.initialize();
  return testDataSource;
};