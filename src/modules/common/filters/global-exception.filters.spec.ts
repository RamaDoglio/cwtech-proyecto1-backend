import { ArgumentsHost, HttpStatus, NotFoundException } from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filters';
import { StockNegativoException } from '../exceptions/stock-negativo.exception';
import { MotivoRequeridoException } from '../exceptions/motivo-requerido.exception';
import { CantidadInvalidaException } from '../exceptions/cantidad-invalida.exception';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let responseMock: { status: jest.Mock; json: jest.Mock };

  const buildHost = (): ArgumentsHost =>
    ({
      switchToHttp: () => ({
        getResponse: () => responseMock,
        getRequest: () => ({ url: '/test', method: 'POST' }),
      }),
    }) as unknown as ArgumentsHost;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
    responseMock = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    // Silenciar los logs del filtro en la corrida de tests
    jest.spyOn(require('@nestjs/common').Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('mapea StockNegativoException a 409 + code STOCK_NEGATIVO', () => {
    const exception = new StockNegativoException(-5, 5, -10);

    filter.catch(exception, buildHost());

    expect(responseMock.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    const body = responseMock.json.mock.calls[0][0];
    expect(body).toMatchObject({
      statusCode: 409,
      code: 'STOCK_NEGATIVO',
      path: '/test',
    });
    expect(body.message).toContain('stock actual: 5');
  });

  it('mantiene compatibilidad con StockNegativoException(resultado) sin contexto', () => {
    const exception = new StockNegativoException(-8);

    filter.catch(exception, buildHost());

    const body = responseMock.json.mock.calls[0][0];
    expect(body.statusCode).toBe(409);
    expect(body.code).toBe('STOCK_NEGATIVO');
    expect(body.message).toContain('-8');
  });

  it('mapea MotivoRequeridoException a 400 + code MOTIVO_REQUERIDO', () => {
    filter.catch(new MotivoRequeridoException(), buildHost());

    const body = responseMock.json.mock.calls[0][0];
    expect(body.statusCode).toBe(400);
    expect(body.code).toBe('MOTIVO_REQUERIDO');
  });

  it('mapea CantidadInvalidaException a 400 + code CANTIDAD_INVALIDA', () => {
    filter.catch(new CantidadInvalidaException(0), buildHost());

    const body = responseMock.json.mock.calls[0][0];
    expect(body.statusCode).toBe(400);
    expect(body.code).toBe('CANTIDAD_INVALIDA');
  });

  it('mapea NotFoundException a 404 + code NO_ENCONTRADO', () => {
    filter.catch(new NotFoundException('Producto no encontrado'), buildHost());

    const body = responseMock.json.mock.calls[0][0];
    expect(body.statusCode).toBe(404);
    expect(body.code).toBe('NO_ENCONTRADO');
  });

  it('propaga details cuando el payload los incluye (exceptionFactory)', () => {
    const { BadRequestException } = require('@nestjs/common');
    const exception = new BadRequestException({
      code: 'VALIDACION_DTO',
      message: 'Datos inválidos',
      details: [{ field: 'motivo', reason: 'required' }],
    });

    filter.catch(exception, buildHost());

    const body = responseMock.json.mock.calls[0][0];
    expect(body.code).toBe('VALIDACION_DTO');
    expect(body.details).toEqual([{ field: 'motivo', reason: 'required' }]);
  });

  it('siempre incluye statusCode, code, timestamp, path, error y message', () => {
    filter.catch(new StockNegativoException(-5, 5, -10), buildHost());

    const body = responseMock.json.mock.calls[0][0];
    expect(body).toHaveProperty('statusCode');
    expect(body).toHaveProperty('code');
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('path');
    expect(body).toHaveProperty('error');
    expect(body).toHaveProperty('message');
  });
});