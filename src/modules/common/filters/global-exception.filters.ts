import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { StockNegativoException } from '../exceptions/stock-negativo.exception';
import { MotivoRequeridoException } from '../exceptions/motivo-requerido.exception';
import { CantidadInvalidaException } from '../exceptions/cantidad-invalida.exception';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // ============================================================
    // Resolver status HTTP según el tipo de excepción
    // ============================================================
    const status = this.resolveStatus(exception);

    // 🔥 LOGS SUPER DETALLADOS 🔥
    this.logger.error('═══════════════════════════════════════════════════════');
    this.logger.error('🚨 ERROR CAPTURADO POR GLOBAL EXCEPTION FILTER 🚨');
    this.logger.error('═══════════════════════════════════════════════════════');
    this.logger.error(`📍 URL: ${request.url}`);
    this.logger.error(`📍 Method: ${request.method}`);
    this.logger.error(`📍 Status Code: ${status}`);
    this.logger.error(`📍 Timestamp: ${new Date().toISOString()}`);
    this.logger.error('───────────────────────────────────────────────────────');
    this.logger.error(
      `🔴 Tipo de Excepción: ${exception?.constructor?.name || 'Unknown'}`,
    );
    this.logger.error(`🔴 Mensaje: ${exception?.message || 'Sin mensaje'}`);
    this.logger.error('───────────────────────────────────────────────────────');

    if (exception?.stack) {
      this.logger.error('📚 STACK TRACE COMPLETO:');
      this.logger.error(exception.stack);
      this.logger.error('───────────────────────────────────────────────────────');
    } else {
      this.logger.error('⚠️ No hay stack trace disponible');
    }

    try {
      const errorDetails = JSON.stringify(
        exception,
        Object.getOwnPropertyNames(exception),
        2,
      );
      this.logger.error('📋 DETALLES COMPLETOS DEL ERROR:');
      this.logger.error(errorDetails);
      this.logger.error('───────────────────────────────────────────────────────');
    } catch (e) {
      this.logger.error('⚠️ No se pudo serializar la excepción completa');
    }

    if (exception?.response) {
      this.logger.error('📨 RESPONSE DEL ERROR:');
      try {
        this.logger.error(JSON.stringify(exception.response, null, 2));
      } catch (e) {
        this.logger.error(exception.response);
      }
      this.logger.error('───────────────────────────────────────────────────────');
    }

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      this.logger.error('🔍 HTTP EXCEPTION RESPONSE:');
      this.logger.error(JSON.stringify(exceptionResponse, null, 2));
      this.logger.error('───────────────────────────────────────────────────────');
    }

    this.logger.error('═══════════════════════════════════════════════════════');

    // ============================================================
    // Respuesta al cliente
    // ============================================================
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: exception?.constructor?.name || 'InternalServerError',
      message: exception?.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && {
        stack: exception?.stack,
        details: exception?.response,
      }),
    };

    response.status(status).json(errorResponse);
  }

  // ============================================================
  // Mapeo de excepción → HTTP status
  // ============================================================
  private resolveStatus(exception: any): number {
    // 1. HttpException → su propio status
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    // 2. Excepciones de dominio → HTTP semántico
    if (exception instanceof StockNegativoException) {
      return HttpStatus.CONFLICT; // 409
    }
    if (exception instanceof MotivoRequeridoException) {
      return HttpStatus.BAD_REQUEST; // 400
    }
    if (exception instanceof CantidadInvalidaException) {
      return HttpStatus.BAD_REQUEST; // 400
    }

    // 3. Fallback → 500
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}