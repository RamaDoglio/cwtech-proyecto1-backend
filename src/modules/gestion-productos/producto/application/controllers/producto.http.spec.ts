import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AuthGuard } from 'src/modules/gestion-usuario/auth/auth.guard';
import { ProductoController } from './producto.controller';
import { ProductoService } from '../services/producto.service';

describe('ProductoController HTTP', () => {
  let app: INestApplication;
  const productoService = { create: jest.fn(), update: jest.fn() };

  const productoValido = {
    denominacion: 'producto de prueba',
    costo: 100,
    utilizaStockMinimo: false,
    utilizaPack: false,
    lineaId: 1,
    marcaId: 1,
    alicuotaIva: 21,
    usuarioCreatedId: 1,
  };

  beforeEach(async () => {
    productoService.create.mockResolvedValue({ mensaje: 'Producto creada.' });
    productoService.update.mockResolvedValue({ mensaje: 'Producto editada.' });
    const module = await Test.createTestingModule({
      controllers: [ProductoController],
      providers: [{ provide: ProductoService, useValue: productoService }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
    jest.clearAllMocks();
  });

  it('acepta costo y margen, sin requerir precio', async () => {
    await request(app.getHttpServer())
      .post('/producto')
      .send({ ...productoValido, margen: 0 })
      .expect(201);

    expect(productoService.create).toHaveBeenCalledWith(
      expect.objectContaining({ costo: 100, margen: 0 }),
    );
  });

  it('rechaza un precio enviado manualmente', async () => {
    const response = await request(app.getHttpServer())
      .post('/producto')
      .send({ ...productoValido, precio: 115 })
      .expect(400);

    expect(response.body.message).toEqual(
      expect.arrayContaining([expect.stringContaining('precio')]),
    );
    expect(productoService.create).not.toHaveBeenCalled();
  });

  it('rechaza la ausencia de costo', async () => {
    const { costo: _costo, ...productoSinCosto } = productoValido;

    const response = await request(app.getHttpServer())
      .post('/producto')
      .send(productoSinCosto)
      .expect(400);

    expect(response.body.message).toEqual(
      expect.arrayContaining(['El costo es obligatorio.']),
    );
    expect(productoService.create).not.toHaveBeenCalled();
  });

  it('rechaza un margen negativo', async () => {
    const response = await request(app.getHttpServer())
      .post('/producto')
      .send({ ...productoValido, margen: -1 })
      .expect(400);

    expect(response.body.message).toEqual(
      expect.arrayContaining(['El margen debe ser un número no negativo.']),
    );
    expect(productoService.create).not.toHaveBeenCalled();
  });

  it('rechaza un precio enviado manualmente al editar', async () => {
    const response = await request(app.getHttpServer())
      .put('/producto/1')
      .send({
        denominacion: 'producto de prueba',
        usuarioUpdatedId: 1,
        precio: 115,
      })
      .expect(400);

    expect(response.body.message).toEqual(
      expect.arrayContaining([expect.stringContaining('precio')]),
    );
    expect(productoService.update).not.toHaveBeenCalled();
  });
});
