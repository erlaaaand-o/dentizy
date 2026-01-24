import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PatientsModule } from './patients/patients.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { MedicalRecordsModule } from './medical_records/medical_records.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SeederModule } from './seeder/seeder.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager';
import { LoggingInterceptor } from './common/interceptors/logging/logging.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { envValidationSchema } from './config/env.validation';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import { HealthController } from './health/health.controller';
// import { DataSource } from 'typeorm';
import { TreatmentCategoriesModule } from './treatment-categories/treatment-categories.module';
import { TreatmentsModule } from './treatments/treatments.module';
import { MedicalRecordTreatmentsModule } from './medical-record-treatments/medical-record-treatments.module';
import { PaymentsModule } from './payments/payments.module';
import { UploadsModule } from './uploads/uploads.module';
// import { FingerprintsModule } from './fingerprints/fingerprints.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      cache: true,
      validationSchema: envValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
      load: [databaseConfig, jwtConfig],
    }),

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('THROTTLE_TTL', 60000),
          limit: configService.get<number>('THROTTLE_LIMIT', 100),
        },
      ],
    }),

    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ttl: configService.get<number>('CACHE_TTL', 300),
        max: configService.get<number>('CACHE_MAX', 100),
      }),
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        autoLoadEntities: true,
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
        extra: {
          connectionLimit: 10,
          connectTimeout: 60000,
        },
        retryAttempts: 3,
        retryDelay: 3000,
      }),
    }),

    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('EMAIL_HOST'),
          port: configService.get<number>('EMAIL_PORT'),
          secure: configService.get<string>('EMAIL_SECURE') === 'true',
          auth: {
            user: configService.get<string>('EMAIL_USER'),
            pass: configService.get<string>('EMAIL_PASS'),
          },
        },
        defaults: {
          from: `"Klinik Dentizy" <${configService.get<string>('EMAIL_USER')}>`,
        },
      }),
    }),

    UsersModule,
    RolesModule,
    PatientsModule,
    AppointmentsModule,
    MedicalRecordsModule,
    NotificationsModule,
    ScheduleModule.forRoot(),
    SeederModule,
    AuthModule,
    TreatmentCategoriesModule,
    TreatmentsModule,
    MedicalRecordTreatmentsModule,
    PaymentsModule,
    UploadsModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
