import {
  INestApplication,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AuthGuard } from 'src/modules/gestion-usuario/auth/auth.guard';
import { GlobalExceptionFilter } from 'src/modules/common/filters/global-exception.filters';
import { StockNegativoException } from 'src/modules/common/exceptions/stock-negativo.exception';
import { ProductoController } from './producto.controller';
import { ProductoService } from '../services/producto.service';

describe('ProductoController HTTP', () => {
  let app: INestApplication;
  const productoService = {
    create: jest.fn(),
    update: jest.fn(),
    ajustarStockManual: jest.fn(),
    cambiarPrecio: jest.fn(),
    findHistorialPrecios: jest.fn(),
    findByRapido: jest.fn(),
    findBy: jest.fn(),
  };

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
    productoService.ajustarStockManual.mockResolvedValue({
      message: 'Stock ajustado para "producto de prueba"',
      stockActual: 12,
    });
    productoService.cambiarPrecio.mockResolvedValue({
      message: 'Precio actualizado para "producto de prueba"',
      precioAnterior: 100,
      precioActual: 150,
    });
    productoService.findHistorialPrecios.mockResolvedValue({
      data: [],
      total: 0,
    });
    productoService.findByRapido.mockResolvedValue({ data: [], total: 0 });
    productoService.findBy.mockResolvedValue({ data: [], total: 0 });
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
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
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

  it('ajusta stock mediante el caso de uso y devuelve el stock resultante', async () => {
    const ajuste = {
      cantidad: 2,
      motivo: '  Recuento de inventario  ',
      usuarioId: 1,
    };

    const response = await request(app.getHttpServer())
      .post('/producto/1/ajustar-manual')
      .send(ajuste)
      .expect(200);

    expect(response.body).toEqual({
      message: 'Stock ajustado para "producto de prueba"',
      stockActual: 12,
    });
    expect(productoService.ajustarStockManual).toHaveBeenCalledWith(1, {
      ...ajuste,
      motivo: 'Recuento de inventario',
    });
  });

  it('rechaza un ajuste manual sin motivo', async () => {
    await request(app.getHttpServer())
      .post('/producto/1/ajustar-manual')
      .send({ cantidad: 2, usuarioId: 1 })
      .expect(400);

    expect(productoService.ajustarStockManual).not.toHaveBeenCalled();
  });

  it('expone 404 cuando el producto no existe', async () => {
    productoService.ajustarStockManual.mockRejectedValueOnce(
      new NotFoundException('Producto con ID 999 no encontrado'),
    );

    await request(app.getHttpServer())
      .post('/producto/999/ajustar-manual')
      .send({ cantidad: 2, motivo: 'Recuento de inventario', usuarioId: 1 })
      .expect(404);
  });

  it('expone 409 cuando el ajuste viola la invariante de stock', async () => {
    productoService.ajustarStockManual.mockRejectedValueOnce(
      new StockNegativoException(-8),
    );

    await request(app.getHttpServer())
      .post('/producto/1/ajustar-manual')
      .send({ cantidad: -20, motivo: 'Recuento de inventario', usuarioId: 1 })
      .expect(409);
  });

  it('cambia el precio mediante el caso de uso y devuelve precio anterior/actual', async () => {
    const cambio = {
      precioNuevo: 150,
      motivo: '  Aumento de costo del proveedor  ',
      usuarioId: 1,
    };

    const response = await request(app.getHttpServer())
      .post('/producto/1/cambiar-precio')
      .send(cambio)
      .expect(200);

    expect(response.body).toEqual({
      message: 'Precio actualizado para "producto de prueba"',
      precioAnterior: 100,
      precioActual: 150,
    });
    expect(productoService.cambiarPrecio).toHaveBeenCalledWith(1, {
      ...cambio,
      motivo: 'Aumento de costo del proveedor',
    });
  });

  it('rechaza un cambio de precio sin motivo', async () => {
    await request(app.getHttpServer())
      .post('/producto/1/cambiar-precio')
      .send({ precioNuevo: 150, usuarioId: 1 })
      .expect(400);

    expect(productoService.cambiarPrecio).not.toHaveBeenCalled();
  });

  it('rechaza un cambio de precio con precioNuevo <= 0', async () => {
    await request(app.getHttpServer())
      .post('/producto/1/cambiar-precio')
      .send({ precioNuevo: 0, motivo: 'motivo', usuarioId: 1 })
      .expect(400);

    expect(productoService.cambiarPrecio).not.toHaveBeenCalled();
  });

  it('expone 404 al cambiar el precio de un producto inexistente', async () => {
    productoService.cambiarPrecio.mockRejectedValueOnce(
      new NotFoundException('Producto con ID 999 no encontrado'),
    );

    await request(app.getHttpServer())
      .post('/producto/999/cambiar-precio')
      .send({ precioNuevo: 150, motivo: 'motivo', usuarioId: 1 })
      .expect(404);
  });

  it('consulta el historial de precios paginado', async () => {
    productoService.findHistorialPrecios.mockResolvedValueOnce({
      data: [
        {
          id: 1,
          productoId: 1,
          precioAnterior: 100,
          precioNuevo: 150,
          motivo: 'Aumento de costo',
          fecha: '2026-01-01T00:00:00.000Z',
          usuarioId: 1,
        },
      ],
      total: 1,
    });

    const response = await request(app.getHttpServer())
      .get('/producto/1/historial-precios')
      .query({ skip: 0, take: 10 })
      .expect(200);

    expect(response.body.total).toBe(1);
    expect(productoService.findHistorialPrecios).toHaveBeenCalledWith(
      1,
      0,
      10,
    );
  });

  describe('búsqueda rápida por código', () => {
    it.each([
      ['true', true],
      ['false', false],
    ])('interpreta exacto=%s como %s', async (query, esperado) => {
      await request(app.getHttpServer())
        .get('/producto/search-by-rapido')
        .query({ codigo: 'ACE', exacto: query, skip: 0, take: 10 })
        .expect(200);

      expect(productoService.findByRapido).toHaveBeenCalledWith(
        'ACE',
        esperado,
        0,
        10,
      );
    });

    it('usa exacto=false si no se envía', async () => {
      await request(app.getHttpServer())
        .get('/producto/search-by-rapido')
        .query({ codigo: 'ACE' })
        .expect(200);

      expect(productoService.findByRapido).toHaveBeenCalledWith(
        'ACE',
        false,
        0,
        10,
      );
    });
  });

  describe('búsqueda filtrada', () => {
    it.each([
      ['true', true],
      ['false', false],
    ])(
      'interpreta codProveedorExacto y conStock en %s como %s',
      async (query, esperado) => {
        await request(app.getHttpServer())
          .get('/producto/search-by')
          .query({
            codigoProveedor: 'ACE',
            codProveedorExacto: query,
            conStock: query,
          })
          .expect(200);

        expect(productoService.findBy).toHaveBeenCalledWith(
          '',
          'ACE',
          esperado,
          '',
          undefined,
          undefined,
          undefined,
          esperado,
          0,
          10,
        );
      },
    );
  });

  it('aplica valores por defecto de paginación en el historial de precios', async () => {
    await request(app.getHttpServer())
      .get('/producto/1/historial-precios')
      .expect(200);

    expect(productoService.findHistorialPrecios).toHaveBeenCalledWith(
      1,
      0,
      10,
    );
  });
});
