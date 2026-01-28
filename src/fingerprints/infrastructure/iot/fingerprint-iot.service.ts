import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mqtt from 'mqtt';
import { MqttClient, IClientOptions } from 'mqtt';

// --- Interfaces & Types ---

export interface IoTMessage<T = Record<string, unknown>> {
  type: 'enrollment' | 'verification' | 'failure' | 'status';
  timestamp: Date;
  data: T;
}

export interface CommandMessage {
  command: string;
  params?: Record<string, unknown>;
  timestamp: Date;
}

// Interface untuk data payload spesifik (bisa disesuaikan dengan kebutuhan domain)
export interface EnrollmentPayload {
  patientId: string;
  fingerPosition?: string;
  status: string;
  [key: string]: unknown;
}

export interface VerificationPayload {
  patientId: string;
  score?: number;
  match?: boolean;
  [key: string]: unknown;
}

export interface FailurePayload {
  errorCode: string;
  message: string;
  [key: string]: unknown;
}

export interface DeviceStatusPayload {
  deviceId: string;
  status: 'online' | 'offline' | 'busy' | 'error';
  batteryLevel?: number;
  [key: string]: unknown;
}

@Injectable()
export class FingerprintIoTService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FingerprintIoTService.name);
  private mqttClient: MqttClient | null = null;
  private connected = false;

  // MQTT Topics
  private readonly TOPICS = {
    ENROLLMENT: 'fingerprint/enrollment',
    VERIFICATION: 'fingerprint/verification',
    FAILURE: 'fingerprint/failure',
    STATUS: 'fingerprint/status',
    DEVICE_STATUS: 'fingerprint/device/status',
    COMMAND: 'fingerprint/command',
  };

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.initializeMqttClient();
  }

  onModuleDestroy() {
    void this.disconnect();
  }

  private initializeMqttClient(): void {
    try {
      const mqttUrl =
        this.configService.get<string>('MQTT_BROKER_URL') ||
        'mqtt://localhost:1883';

      const clientId = `fingerprint-service-${Math.random().toString(16).slice(2, 10)}`;

      const options: IClientOptions = {
        clientId,
        clean: true,
        connectTimeout: 4000,
        username: this.configService.get<string>('MQTT_USERNAME'),
        password: this.configService.get<string>('MQTT_PASSWORD'),
        reconnectPeriod: 1000,
      };

      this.mqttClient = mqtt.connect(mqttUrl, options);

      this.mqttClient.on('connect', () => {
        this.connected = true;
        this.logger.log(`✅ MQTT Connected to ${mqttUrl}`);
        this.subscribeToTopics();
      });

      this.mqttClient.on('error', (error: Error) => {
        this.logger.error(`❌ MQTT Connection error:`, error.message);
        this.connected = false;
      });

      this.mqttClient.on('reconnect', () => {
        this.logger.log('🔄 MQTT Reconnecting...');
      });

      this.mqttClient.on('close', () => {
        this.logger.warn('⚠️ MQTT Connection closed');
        this.connected = false;
      });

      this.mqttClient.on('message', (topic: string, message: Buffer) => {
        this.handleIncomingMessage(topic, message);
      });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to initialize MQTT client:`, errMsg);
    }
  }

  private subscribeToTopics(): void {
    if (!this.mqttClient) return;

    // Helper to handle subscription callbacks
    const subCallback = (topicName: string) => (err: Error | null) => {
      if (err) {
        this.logger.error(`Failed to subscribe to ${topicName}:`, err.message);
      } else {
        this.logger.log(`✅ Subscribed to ${topicName}`);
      }
    };

    this.mqttClient.subscribe(
      this.TOPICS.COMMAND,
      subCallback(this.TOPICS.COMMAND),
    );
    this.mqttClient.subscribe(
      this.TOPICS.DEVICE_STATUS,
      subCallback(this.TOPICS.DEVICE_STATUS),
    );
  }

  private handleIncomingMessage(topic: string, message: Buffer): void {
    try {
      // JSON.parse returns 'any', we assign to 'unknown' immediately for safety
      const payloadString = message.toString();
      const payload: unknown = JSON.parse(payloadString);

      this.logger.debug(`📨 Received message on ${topic}:`, payload);

      switch (topic) {
        case this.TOPICS.COMMAND:
          this.handleCommand(payload);
          break;
        case this.TOPICS.DEVICE_STATUS:
          this.handleDeviceStatus(payload);
          break;
        default:
          this.logger.warn(`Unknown topic: ${topic}`);
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to parse message from ${topic}:`, errMsg);
    }
  }

  private handleCommand(payload: unknown): void {
    // Type Guard or validation logic usually goes here
    if (this.isValidCommandPayload(payload)) {
      this.logger.log(`📋 Command received:`, payload);
      // Implementation logic...
    } else {
      this.logger.warn('Received invalid command payload structure');
    }
  }

  private handleDeviceStatus(payload: unknown): void {
    if (typeof payload === 'object' && payload !== null) {
      this.logger.log(`📊 Device status update:`, payload);
      // Implementation logic...
    } else {
      this.logger.warn('Received invalid device status payload');
    }
  }

  /**
   * Notify enrollment success
   */
  async notifyEnrollment(data: EnrollmentPayload): Promise<void> {
    const message: IoTMessage<EnrollmentPayload> = {
      type: 'enrollment',
      timestamp: new Date(),
      data,
    };

    await this.publish(this.TOPICS.ENROLLMENT, message);
  }

  /**
   * Notify verification success
   */
  async notifyVerification(data: VerificationPayload): Promise<void> {
    const message: IoTMessage<VerificationPayload> = {
      type: 'verification',
      timestamp: new Date(),
      data,
    };

    await this.publish(this.TOPICS.VERIFICATION, message);
  }

  /**
   * Notify verification failure
   */
  async notifyFailure(data: FailurePayload): Promise<void> {
    const message: IoTMessage<FailurePayload> = {
      type: 'failure',
      timestamp: new Date(),
      data,
    };

    await this.publish(this.TOPICS.FAILURE, message);
  }

  /**
   * Send device command
   */
  async sendDeviceCommand(
    command: string,
    params?: Record<string, unknown>,
  ): Promise<void> {
    const message: CommandMessage = {
      command,
      params,
      timestamp: new Date(),
    };

    await this.publish(this.TOPICS.COMMAND, message);
  }

  /**
   * Publish status update
   */
  async publishStatus(status: Record<string, unknown>): Promise<void> {
    const message: IoTMessage<Record<string, unknown>> = {
      type: 'status',
      timestamp: new Date(),
      data: status,
    };

    await this.publish(this.TOPICS.STATUS, message);
  }

  /**
   * Generic publish method wrapped in Promise
   */
  private publish(topic: string, message: object): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.mqttClient || !this.connected) {
        this.logger.warn(`MQTT not connected, skipping publish to ${topic}`);
        // Kita resolve saja agar tidak crash flow aplikasi, tapi log warning
        resolve();
        return;
      }

      try {
        const payload = JSON.stringify(message);
        this.mqttClient.publish(topic, payload, { qos: 1 }, (error) => {
          if (error) {
            this.logger.error(`Failed to publish to ${topic}:`, error.message);
            reject(error);
          } else {
            this.logger.debug(`✅ Published to ${topic}`);
            resolve();
          }
        });
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        this.logger.error(`Error publishing to ${topic}:`, errMsg);
        reject(error);
      }
    });
  }

  /**
   * Check connection status
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Disconnect from MQTT broker
   */
  async disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (this.mqttClient) {
        this.mqttClient.end(false, {}, () => {
          this.logger.log('MQTT client disconnected');
          this.connected = false;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  // --- Helper Guards ---
  private isValidCommandPayload(payload: unknown): payload is CommandMessage {
    return (
      typeof payload === 'object' && payload !== null && 'command' in payload
    );
  }
}
