import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalPipes(new ValidationPipe());
  
  const config = new DocumentBuilder()
    .setTitle('Resource Tracker API')
    .setDescription(
      'API document for resource tracker system. This api supports user registration and login, resource requests, resource tracking, and department, teams, and projects.')
    .addTag(
      'Authentication',
      'Allows users log in to access the resource tracker.')
      .addTag('Users',
        'Users section allows users to register their accounts into the system and allow them to modify some their stored information. Users section also allows higher authorities to modify user roles'
      )
      .addTag('Notifications',
        'Notifications allows users to get notifications sent to them, they can also delete notifications'
      )
      .addTag('Departments',
        'This section allows creation of a deprtment, deletion of a department, viewing departments'
      )
      .addTag('Projects',
        'This section allows creation of projects, viewing projects, deleting projects'
      )
      .addTag('Dashboard',
        'Provides an overview of resource tracker activity, summary metrics, and recent activity.'
      )
      .addTag('Teams',
        'Allows users to create, view, update, and manage teams.'
      )
      .addTag('Resource Allocations',
        'Allows users to view and create allocations of resources.'
      )
      .addTag('Audit Logs',
        'Provides a record of system changes and activity for review.'
      )
      .addTag('Line Manager',
        'Allows line managers to review resource requests and manage approvals.'
      )
      .addTag('Reports',
        'Provides reports on resource requests, approvals, spending, and allocations.'
      )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'access-token'
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    jsonDocumentUrl: 'api/docs-json',
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
