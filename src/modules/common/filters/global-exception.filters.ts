import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainException } from '../exceptions/domain.exception';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, code } = this.resolveStatusAndCode(exception);
    const details = this.resolveDetails(exception);

    this.logger.error(
      '═══════════════════════════════════════════════════════',
    );
    this.logger.error('🚨 ERROR CAPTURADO POR GLOBAL EXCEPTION FILTER 🚨');
    this.logger.error(
      '═══════════════════════════════════════════════════════',
    );
    this.logger.error(`📍 URL: ${request.url}`);
    this.logger.error(`📍 Method: ${request.method}`);
    this.logger.error(`📍 Status Code: ${status}`);
    this.logger.error(`📍 Code: ${code}`);
    this.logger.error(`📍 Timestamp: ${new Date().toISOString()}`);
    this.logger.error(
      '───────────────────────────────────────────────────────',
    );
    this.logger.error(
      `🔴 Tipo de Excepción: ${exception?.constructor?.name || 'Unknown'}`,
    );
    this.logger.error(`🔴 Mensaje: ${exception?.message || 'Sin mensaje'}`);
    this.logger.error(
      '───────────────────────────────────────────────────────',
    );

    if (exception?.stack) {
      this.logger.error('📚 STACK TRACE COMPLETO:');
      this.logger.error(exception.stack);
      this.logger.error(
        '───────────────────────────────────────────────────────',
      );
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
      this.logger.error(
        '───────────────────────────────────────────────────────',
      );
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
      this.logger.error(
        '───────────────────────────────────────────────────────',
      );
    }

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      this.logger.error('🔍 HTTP EXCEPTION RESPONSE:');
      this.logger.error(JSON.stringify(exceptionResponse, null, 2));
      this.logger.error(
        '───────────────────────────────────────────────────────',
      );
    }

    this.logger.error(
      '═══════════════════════════════════════════════════════',
    );

    // ============================================================
    // Respuesta al cliente
    // ============================================================
    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const responseBody: { error?: string; message?: unknown } | undefined =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? exceptionResponse
        : undefined;

    const errorResponse = {
      statusCode: status,
      code,
      timestamp: new Date().toISOString(),
      path: request.url,
      error:
        responseBody?.error ||
        exception?.constructor?.name ||
        'InternalServerError',
      message:
        responseBody?.message ||
        exceptionResponse ||
        exception?.message ||
        'Internal Server Error',
      ...(details && { details }),
      ...(process.env.NODE_ENV === 'development' && {
        stack: exception?.stack,
      }),
    };

    response.status(status).json(errorResponse);
  }

  // ============================================================
  // Mapeo de excepción → { status, code }
  // ============================================================
  private resolveStatusAndCode(exception: any): {
    status: number;
    code: string;
  } {
    // 1. Excepciones de dominio (base común) → status + code propios
    if (exception instanceof DomainException) {
      return { status: exception.httpStatus, code: exception.code };
    }

    // 2. HttpException (built-in + subclases propias)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();

      // 2a. Payload con `code` explícito (ej. desde exceptionFactory)
      if (
        typeof body === 'object' &&
        body !== null &&
        typeof (body as any).code === 'string'
      ) {
        return { status, code: (body as any).code };
      }

      // 2b. Subclase con propiedad `code` propia
      if (typeof (exception as any).code === 'string') {
        return { status, code: (exception as any).code };
      }

      // 2c. Fallback por status
      return { status, code: this.codeForStatus(status) };
    }

    // 3. Error no controlado
    return { status: HttpStatus.INTERNAL_SERVER_ERROR, code: 'ERROR_INTERNO' };
  }

  private resolveDetails(exception: any): any[] | undefined {
    if (!(exception instanceof HttpException)) return undefined;
    const body = exception.getResponse();
    if (
      typeof body === 'object' &&
      body !== null &&
      Array.isArray((body as any).details)
    ) {
      return (body as any).details;
    }
    return undefined;
  }

  private codeForStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:  return 'SOLICITUD_INVALIDA';
      case HttpStatus.UNAUTHORIZED: return 'NO_AUTORIZADO';
      case HttpStatus.FORBIDDEN:    return 'PROHIBIDO';
      case HttpStatus.NOT_FOUND:    return 'NO_ENCONTRADO';
      case HttpStatus.CONFLICT:     return 'CONFLICTO';
      default:                      return 'ERROR';
    }
  }
}