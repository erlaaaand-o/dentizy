import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Patient } from '../patients/domains/entities/patient.entity';

import { FingerprintsService } from './application/orchestrator/fingerprints.service';
import { FingerprintDeletionService } from './application/use-cases/fingerprint-deletion.service';
import { FingerprintEnrollmentService } from './application/use-cases/fingerprint-enrollment.service';
import { FingerprintSyncService } from './application/use-cases/fingerprint-sync.service';
import { FingerprintVerificationService } from './application/use-cases/fingerprint-verification.service';
import { Fingerprint } from './domains/entities/fingerprint.entity';
import { FingerprintMapper } from './domains/mappers/fingerprint.mapper';
import { FingerprintValidator } from './domains/validators/fingerprint.validator';
import { FingerprintCacheService } from './infrastructure/cache/fingerprint-cache.service';
import { DigitalPersonaAdapter } from './infrastructure/devices/adapters/digital-persona-adapter';
import { MorphoAdapter } from './infrastructure/devices/adapters/morpho-adapter';
import { ZKTecoAdapter } from './infrastructure/devices/adapters/zkteco-adapter';
import { FingerprintDeviceFactory } from './infrastructure/devices/fingerprint-device-factory';
import { FingerprintIoTService } from './infrastructure/iot/fingerprint-iot.service';
import { FingerprintGateway } from './infrastructure/iot/fingerprint.gateway';
import { FingerprintEventListener } from './infrastructure/listeners/fingerprint.event-listener';
import { FingerprintsController } from './interface/http/fingerprints.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Fingerprint, Patient]),
    ConfigModule,
    CacheModule.register({
      ttl: 3600, // 1 hour
      max: 100, // maximum number of items in cache
    }),
    EventEmitterModule.forRoot(),
  ],
  controllers: [FingerprintsController],
  providers: [
    // Orchestrator
    FingerprintsService,

    // Use Cases
    FingerprintEnrollmentService,
    FingerprintVerificationService,
    FingerprintDeletionService,
    FingerprintSyncService,

    // Domain Services
    FingerprintValidator,
    FingerprintMapper,

    // Infrastructure - Devices
    FingerprintDeviceFactory,
    ZKTecoAdapter,
    MorphoAdapter,
    DigitalPersonaAdapter,

    // Infrastructure - Cache
    FingerprintCacheService,

    // Infrastructure - IoT
    FingerprintIoTService,
    FingerprintGateway,

    // Infrastructure - Events
    FingerprintEventListener,
  ],
  exports: [
    FingerprintsService,
    FingerprintDeviceFactory,
    FingerprintIoTService,
    FingerprintCacheService,
  ],
})
export class FingerprintsModule {}
