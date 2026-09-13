import { Test, TestingModule } from '@nestjs/testing';
import { ProductoOperacionController } from './producto-operacion.controller';
import { ProductoOperacionService } from './producto-operacion.service';

// MOCK del servicio (todos los métodos que usa el controlador)
const mockProductoOperacionService = {
  create: jest.fn().mockReturnValue('This action adds a new productoOperacion'),
  findAll: jest.fn().mockReturnValue('This action returns all productoOperacion'),
  findOne: jest.fn().mockImplementation((id: number) => `This action returns a #${id} productoOperacion`),
  update: jest.fn().mockImplementation((id: number) => `This action updates a #${id} productoOperacion`),
  remove: jest.fn().mockImplementation((id: number) => `This action removes a #${id} productoOperacion`),
};

describe('ProductoOperacionController', () => {
  let controller: ProductoOperacionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductoOperacionController],
      providers: [
        { provide: ProductoOperacionService, useValue: mockProductoOperacionService },
      ],
    }).compile();

    controller = module.get<ProductoOperacionController>(ProductoOperacionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});