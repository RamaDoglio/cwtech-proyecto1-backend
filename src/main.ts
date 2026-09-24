import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './modules/common/filters/global-exception.filters';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import * as bodyParser from 'body-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Convierte el cuerpo a la clase del DTO
      whitelist: true, // Elimina propiedades no declaradas en el DTO
      forbidNonWhitelisted: true, // Lanza error si se reciben propiedades no permitidas
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors: ValidationError[]) => {
        const flatten = (
          errs: ValidationError[],
          parent = '',
        ): Array<{ field: string; reason: string }> =>
          errs.flatMap((err) => {
            const path = parent ? `${parent}.${err.property}` : err.property;
            const own = Object.values(err.constraints ?? {}).map((reason) => ({
              field: path,
              reason,
            }));
            const nested = err.children?.length
              ? flatten(err.children, path)
              : [];
            return [...own, ...nested];
          });
        return new BadRequestException({
          code: 'VALIDACION_DTO',
          message: 'Datos inválidos en la solicitud',
          details: flatten(errors),
        });
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Gestión Base - Distribuidora')
    .setDescription('La descripción de las  API  de la distribuidora')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'access-token',
    )
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  app.setGlobalPrefix('api');

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();