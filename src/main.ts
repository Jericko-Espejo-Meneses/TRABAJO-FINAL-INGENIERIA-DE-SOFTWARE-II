import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: (origin, callback) => {
      // Peticiones locales o sin cabecera origin (curl, Postman, server-to-server)
      if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      const allowedOrigins = process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
        : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization,Accept,X-Requested-With',
    exposedHeaders: 'Authorization',
    credentials: true,
  });

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Middleware de compatibilidad: Soporta tanto '/api/...' (frontend por defecto) como '/api/v1/...'
  app.use((req: any, res: any, next: any) => {
    if (req.url.startsWith('/api/') && !req.url.startsWith('/api/v1/') && !req.url.startsWith('/api/docs')) {
      req.url = req.url.replace('/api/', '/api/v1/');
    }
    next();
  });

  // Prefix global para endpoints
  app.setGlobalPrefix('api/v1');

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('HealthExpress API')
    .setDescription(
      `## HealthExpress — Product Road Map Backend
API desarrollada con NestJS para la plataforma de pedidos de comida saludable, impacto social y seguimiento de HealthExpress.

### Alcance Total Implementado (Sprint 1 a Sprint 8):

#### 🚀 Release 1
- **Sprint 1 (Registro y Autenticación)**:
  - **HE-HU1-001**: Registro con correo o redes sociales (Google, Facebook, Apple).
  - **HE-HU10-010**: Inicio de sesión con correo o redes sociales y emisión de JWT.
- **Sprint 2 (Exploración y Recomendaciones)**:
  - **HE-HU2-002**: Búsqueda y filtrado de restaurantes con opciones saludables (vegano, keto, sin gluten, calorías, tiempo).
- **Sprint 3 (Exploración y Recomendaciones)**:
  - **HE-HU3-003**: Recomendaciones inteligentes de menús saludables basadas en metas nutricionales y macronutrientes.
- **Sprint 3 y 4 (Carrito, Pedidos y Pagos)**:
  - **HE-HU4-004**: Carrito de compras con balance nutricional acumulado en tiempo real.
  - **HE-HU8-008**: Confirmación de pedido a partir del carrito con dirección y contacto.
  - **HE-HU9-009**: Selección de método de pago (tarjeta, Yape/Plin, efectivo) y procesamiento de pago.
- **Sprint 4 (Donación Automática)**:
  - **HE-HU5-005**: Donación automática del 3% de la compra a ONGs aliadas sin costo extra.

#### 🌟 Release 2
- **Sprint 5 (Historial e Impacto Social)**:
  - **HE-HU6-006**: Historial completo de pedidos y panel de impacto social (dinero donado y raciones alimentarias equivalentes).
- **Sprint 6 (Notificaciones y Logros)**:
  - **HE-HU7-007**: Notificaciones de promociones, actualizaciones de pedidos y desbloqueo de logros/insignias saludables.
- **Sprint 7 (Perfil y Personalización)**:
  - **HE-HU11-011**: Edición del perfil de usuario (datos personales, preferencias dietéticas, metas y direcciones guardadas).
  - **HE-HU13-013**: Seguimiento en tiempo real del estado del pedido (timeline, progreso porcentual, repartidor).
- **Sprint 8 (Favoritos y Productos Detallados)**:
  - **HE-HU12-012**: Gestión de restaurantes y platos favoritos (agregar, eliminar, listar y alternar).
  - **HE-HU14-014**: Desglose y ficha nutricional completa (macronutrientes, micronutrientes, NutriScore, índice glucémico, ingredientes y alérgenos).`,
    )
    .setVersion('2.1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingrese su token JWT generado en /api/v1/auth/login o /api/v1/auth/register',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'HealthExpress API Documentation',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`====================================================`);
  logger.log(`🚀 HealthExpress Backend corriendo en: http://localhost:${port}/api/v1`);
  logger.log(`📚 Documentación Swagger interactiva: http://localhost:${port}/api/docs`);
  logger.log(`====================================================`);
}

bootstrap();
