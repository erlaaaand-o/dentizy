import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Entities
import { Fingerprint } from './domains/entities/fingerprint.entity';
import { Patient } from '../patients/domains/entities/patient.entity';

// Controllers
import { FingerprintsController } from './interface/http/fingerprints.controller';

// Services - Orchestrator
import { FingerprintsService } from './application/orchestrator/fingerprints.service';

// Services - Use Cases
import { FingerprintEnrollmentService } from './application/use-cases/fingerprint-enrollment.service';
import { FingerprintVerificationService } from './application/use-cases/fingerprint-verification.service';
import { FingerprintDeletionService } from './application/use-cases/fingerprint-deletion.service';
import { FingerprintSyncService } from './application/use-cases/fingerprint-sync.service';

// Domain Services
import { FingerprintValidator } from './domains/validators/fingerprint.validator';
import { FingerprintMapper } from './domains/mappers/fingerprint.mapper';

// Infrastructure - Devices
import { FingerprintDeviceFactory } from './infrastructure/devices/fingerprint-device-factory';
import { ZKTecoAdapter } from './infrastructure/devices/adapters/zkteco-adapter';
import { MorphoAdapter } from './infrastructure/devices/adapters/morpho-adapter';
import { DigitalPersonaAdapter } from './infrastructure/devices/adapters/digital-persona-adapter';

// Infrastructure - Cache
import { FingerprintCacheService } from './infrastructure/cache/fingerprint-cache.service';

// Infrastructure - IoT
import { FingerprintIoTService } from './infrastructure/iot/fingerprint-iot.service';
import { FingerprintGateway } from './infrastructure/iot/fingerprint.gateway';

// Infrastructure - Events
import { FingerprintEventListener } from './infrastructure/listeners/fingerprint.event-listener';

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
