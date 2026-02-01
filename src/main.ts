import * as fs from 'fs';
import * as path from 'path';
import { join } from 'path';

import { Logger, ValidationPipe, INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { DataSource } from 'typeorm';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { SeederService } from './seeder/seeder.service';

function configureSecurity(
  app: NestExpressApplication,
  configService: ConfigService,
  nodeEnv: string,
) {
  const port = configService.get<number>('PORT', 3000);
  const frontendUrl = configService.get<string>('FRONTEND_URL');
  const localIp: string = configService.get<string>('LOCAL_IP') ?? '127.0.0.1';
  const localNetworkBackend = `http://${localIp}:${port}`;
  const lanFrontendUrl = configService.get<string>('FRONTEND_URL_LAN');

  app.use(
    helmet({
      contentSecurityPolicy: nodeEnv === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: nodeEnv === 'production',
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // 2. CORS Configuration
  const allowedOrigins =
    nodeEnv === 'production'
      ? [frontendUrl]
      : [
          frontendUrl,
          'http://localhost:3000',
          'http://localhost:3001',
          lanFrontendUrl,
          localNetworkBackend,
        ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        if (nodeEnv !== 'production') {
          return callback(null, true);
        }

        return callback(null, false);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn(`🚫 CORS BLOCKED — Origin: ${origin}`);
      console.warn(`Allowed: ${allowedOrigins.join(', ')}`);

      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page-Number'],
    maxAge: 3600,
  });
}

function setupSwagger(app: INestApplication, nodeEnv: string, logger: Logger) {
  if (nodeEnv === 'production') return;
  const config = new DocumentBuilder()
    .setTitle('Dentizy API')
    .setDescription('API Documentation untuk Sistem Manajemen Klinik Gigi')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Masukkan JWT Token di sini',
      },
      'access-token',
    )
    .addTag('Authentication', 'Endpoints untuk login dan autentikasi')
    .addTag('Users', 'Manajemen user (dokter, staf, kepala klinik)')
    .addTag('Patients', 'Manajemen data pasien')
    .addTag('Appointments', 'Manajemen janji temu')
    .addTag('Medical Records', 'Manajemen rekam medis')
    .addTag('Notifications', 'Sistem notifikasi dan reminder')
    .addTag('Treatments', 'Manajemen master data tindakan/perawatan gigi')
    .addTag(
      'Treatment Categories',
      'Manajemen kategori tindakan (Scaling, Cabut Gigi, dll)',
    )
    .addTag(
      'Medical Record Treatments',
      'Manajemen rincian tindakan yang dilakukan pada pasien',
    )
    .addTag('Payments', 'Manajemen transaksi pembayaran dan invoice')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
    },
  });

  try {
    logger.log('📝 Generating swagger.json file...');

    const swaggerPath = path.join(
      __dirname,
      '..',
      '..',
      'frontend',
      'swagger.json',
    );

    const dir = path.dirname(swaggerPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(swaggerPath, JSON.stringify(document, null, 2));

    logger.log(`✅ swagger.json generated successfully at ${swaggerPath}`);
  } catch (err) {
    logger.error('❌ Failed to generate swagger.json:', err);
  }

  logger.log('📚 Swagger available at: /api-docs');
}

async function checkDatabaseConnection(
  app: INestApplication,
  logger: Logger,
  nodeEnv: string,
) {
  try {
    const dataSource = app.get(DataSource);
    await dataSource.query('SELECT 1');
    logger.log('✅ Database connection successful');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('❌ Database connection failed:', message);

    if (nodeEnv === 'production') {
      throw new Error(
        'Cannot connect to database. Please check your configuration.',
      );
    } else {
      logger.warn('⚠️ Continuing without database in development mode');
    }
  }
}

async function runSeeding(app: INestApplication, logger: Logger) {
  try {
    const seeder = app.get(SeederService);
    await seeder.seed();
    logger.log('✅ Database seeding completed');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('❌ Seeding failed:', message);
  }
}

function setupGracefulShutdown(app: INestApplication, logger: Logger) {
  const gracefulShutdown = async (signal: string) => {
    logger.warn(`⚠️ ${signal} signal received: closing HTTP server`);
    try {
      await app.close();
      logger.log('✅ Application closed gracefully');
      process.exit(0);
    } catch (error) {
      logger.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => {
    void gracefulShutdown('SIGTERM');
  });
  process.on('SIGINT', () => {
    void gracefulShutdown('SIGINT');
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    if (process.env.NODE_ENV === 'production') {
      void gracefulShutdown('UNHANDLED_REJECTION');
    }
  });
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const nodeEnv: 'production' | 'development' | 'test' =
      (process.env.NODE_ENV as 'production' | 'development' | 'test') ??
      'production';

    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger:
        nodeEnv === 'production'
          ? ['error', 'warn', 'log']
          : ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    const configService = app.get(ConfigService);

    const port = configService.get<number>('PORT', 3000);
    const frontendUrl = configService.get<string>('FRONTEND_URL') ?? 'N/A';

    app.useGlobalFilters(new HttpExceptionFilter());

    app.useStaticAssets(join(__dirname, '..', 'public'), {
      prefix: '/public/',
    });

    app.useStaticAssets(join(__dirname, '..', 'public/uploads'), {
      prefix: '/uploads/',
    });

    if (!configService.get<string>('JWT_SECRET')) {
      throw new Error('JWT_SECRET is not defined in environment variables!');
    }

    if (!configService.get<string>('FRONTEND_URL')) {
      throw new Error('FRONTEND_URL is not defined in environment variables!');
    }

    configureSecurity(app, configService, nodeEnv);

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        disableErrorMessages: nodeEnv === 'production',
        validationError: { target: false, value: false },
      }),
    );

    setupSwagger(app, nodeEnv, logger);

    await checkDatabaseConnection(app, logger, nodeEnv);

    if (nodeEnv !== 'production') {
      await runSeeding(app, logger);
    }

    setupGracefulShutdown(app, logger);

    await app.listen(port);

    const envLabel = String(nodeEnv).padEnd(35);
    const portLabel = String(port).padEnd(35);
    const urlLabel = `http://localhost:${port}`.padEnd(35);
    const corsLabel = String(frontendUrl).padEnd(35);

    logger.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚀 Dentizy API Server Started Successfully         ║
║                                                       ║
║   🌍 Environment:  ${envLabel}║
║   🔌 Port:         ${portLabel}║
║   📡 URL:          ${urlLabel}║
${nodeEnv !== 'production' ? `║   📖 API Docs:     http://localhost:${port}/api-docs${' '.repeat(14)}║` : ''}
║   🔐 CORS Origin:  ${corsLabel}║
║   🏥 Health:       http://localhost:${port}/health${' '.repeat(19)}║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
    `);

    if (nodeEnv === 'production') {
      logger.warn('⚠️ Running in PRODUCTION mode');
      logger.warn('⚠️ Make sure all environment variables are properly set');
      logger.warn('⚠️ CORS is strictly enforced');
    } else {
      logger.log('🛠️ Running in DEVELOPMENT mode');
      logger.log('🔓 CORS is relaxed for local development');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('❌ Application failed to start:', message);
    process.exit(1);
  }
}

bootstrap().catch((err) => {
  console.error('❌ Bootstrap error:', err);
  process.exit(1);
});
