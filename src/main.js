import { NestFactory } from '@nestjs/core';
import { VersioningType, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';


async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });
 
  // Set global API prefix
  app.setGlobalPrefix('api');


  // Enable URI-based versioning (adds /v1 to all endpoints by default)
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });


  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );


  // Enable global Prisma database exception handler filter
  const { PrismaExceptionFilter } = await import('./common/filters/prisma-exception.filter.js');
  app.useGlobalFilters(new PrismaExceptionFilter());


  // Setup Swagger API Documentation
  const { SwaggerModule, DocumentBuilder } = await import('@nestjs/swagger');
  const config = new DocumentBuilder()
    .setTitle('Enterprise ATS Backend')
    .setDescription('Production-ready Applicant Tracking System (ATS) Core REST API documentation.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
 
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);


  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://localhost:${port}/api/v1`);
  console.log(`Swagger documentation is available at: http://localhost:${port}/api-docs`);
}
bootstrap();