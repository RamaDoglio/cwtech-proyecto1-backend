import { Test, TestingModule } from '@nestjs/testing';
import { RolController } from './rol.controller';
import { RolService } from '../services/rol.service';

const mockRolService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  findByDenominacionFiltered: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('RolController', () => {
  let controller: RolController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolController],
      providers: [{ provide: RolService, useValue: mockRolService }],
    }).compile();

    controller = module.get<RolController>(RolController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});