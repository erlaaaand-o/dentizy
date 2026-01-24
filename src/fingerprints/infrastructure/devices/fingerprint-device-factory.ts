import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IFingerprintDevice } from './fingerprint-device.interface';
import { ZKTecoAdapter } from './adapters/zkteco-adapter';
import { MorphoAdapter } from './adapters/morpho-adapter';
import { DigitalPersonaAdapter } from './adapters/digital-persona-adapter';

export enum DeviceType {
  ZKTECO = 'zkteco',
  MORPHO = 'morpho',
  DIGITAL_PERSONA = 'digital_persona',
}

@Injectable()
export class FingerprintDeviceFactory {
  private readonly logger = new Logger(FingerprintDeviceFactory.name);
  private deviceInstance: IFingerprintDevice;

  constructor(private readonly configService: ConfigService) {
    this.initializeDevice();
  }

  private initializeDevice(): void {
    const deviceType = this.configService.get<string>(
      'FINGERPRINT_DEVICE_TYPE',
      DeviceType.ZKTECO,
    );

    switch (deviceType) {
      case DeviceType.ZKTECO:
        this.deviceInstance = new ZKTecoAdapter(this.configService);
        break;
      case DeviceType.MORPHO:
        this.deviceInstance = new MorphoAdapter(this.configService);
        break;
      case DeviceType.DIGITAL_PERSONA:
        this.deviceInstance = new DigitalPersonaAdapter(this.configService);
        break;
      default:
        this.logger.warn(
          `Unknown device type: ${deviceType}, defaulting to ZKTeco`,
        );
        this.deviceInstance = new ZKTecoAdapter(this.configService);
    }

    this.logger.log(`📱 Fingerprint device initialized: ${deviceType}`);
  }

  getDevice(): IFingerprintDevice {
    return this.deviceInstance;
  }
}
