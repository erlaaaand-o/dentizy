import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mqtt from 'mqtt';
import { MqttClient } from 'mqtt';

export interface IoTMessage {
  type: 'enrollment' | 'verification' | 'failure' | 'status';
  timestamp: Date;
  data: any;
}

@Injectable()
export class FingerprintIoTService {
  private readonly logger = new Logger(FingerprintIoTService.name);
  private mqttClient: MqttClient;
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

  constructor(private readonly configService: ConfigService) {
    this.initializeMqttClient();
  }

  private async initializeMqttClient(): Promise<void> {
    try {
      const mqttUrl =
        this.configService.get<string>('MQTT_BROKER_URL') ||
        'mqtt://localhost:1883';
      const clientId = `fingerprint-service-${Math.random().toString(16).slice(2, 10)}`;

      const options = {
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

      this.mqttClient.on('error', (error) => {
        this.logger.error(`❌ MQTT Connection error:`, error);
        this.connected = false;
      });

      this.mqttClient.on('reconnect', () => {
        this.logger.log('🔄 MQTT Reconnecting...');
      });

      this.mqttClient.on('close', () => {
        this.logger.warn('⚠️ MQTT Connection closed');
        this.connected = false;
      });

      this.mqttClient.on('message', (topic, message) => {
        this.handleIncomingMessage(topic, message);
      });
    } catch (error) {
      this.logger.error(`Failed to initialize MQTT client:`, error);
    }
  }

  private subscribeToTopics(): void {
    // Subscribe to command topics for receiving commands from devices
    this.mqttClient.subscribe(this.TOPICS.COMMAND, (err) => {
      if (err) {
        this.logger.error(
          `Failed to subscribe to ${this.TOPICS.COMMAND}:`,
          err,
        );
      } else {
        this.logger.log(`✅ Subscribed to ${this.TOPICS.COMMAND}`);
      }
    });

    this.mqttClient.subscribe(this.TOPICS.DEVICE_STATUS, (err) => {
      if (err) {
        this.logger.error(
          `Failed to subscribe to ${this.TOPICS.DEVICE_STATUS}:`,
          err,
        );
      } else {
        this.logger.log(`✅ Subscribed to ${this.TOPICS.DEVICE_STATUS}`);
      }
    });
  }

  private handleIncomingMessage(topic: string, message: Buffer): void {
    try {
      const payload = JSON.parse(message.toString());
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
      this.logger.error(`Failed to parse message from ${topic}:`, error);
    }
  }

  private handleCommand(payload: any): void {
    this.logger.log(`📋 Command received:`, payload);
    // Handle commands from devices (e.g., enroll, verify, reset)
    // This can be extended based on your requirements
  }

  private handleDeviceStatus(payload: any): void {
    this.logger.log(`📊 Device status update:`, payload);
    // Handle device status updates
  }

  /**
   * Notify enrollment success
   */
  async notifyEnrollment(data: any): Promise<void> {
    const message: IoTMessage = {
      type: 'enrollment',
      timestamp: new Date(),
      data,
    };

    await this.publish(this.TOPICS.ENROLLMENT, message);
  }

  /**
   * Notify verification success
   */
  async notifyVerification(data: any): Promise<void> {
    const message: IoTMessage = {
      type: 'verification',
      timestamp: new Date(),
      data,
    };

    await this.publish(this.TOPICS.VERIFICATION, message);
  }

  /**
   * Notify verification failure
   */
  async notifyFailure(data: any): Promise<void> {
    const message: IoTMessage = {
      type: 'failure',
      timestamp: new Date(),
      data,
    };

    await this.publish(this.TOPICS.FAILURE, message);
  }

  /**
   * Send device command
   */
  async sendDeviceCommand(command: string, params?: any): Promise<void> {
    const message = {
      command,
      params,
      timestamp: new Date(),
    };

    await this.publish(this.TOPICS.COMMAND, message);
  }

  /**
   * Publish status update
   */
  async publishStatus(status: any): Promise<void> {
    const message: IoTMessage = {
      type: 'status',
      timestamp: new Date(),
      data: status,
    };

    await this.publish(this.TOPICS.STATUS, message);
  }

  /**
   * Generic publish method
   */
  private async publish(topic: string, message: any): Promise<void> {
    if (!this.connected) {
      this.logger.warn(`MQTT not connected, skipping publish to ${topic}`);
      return;
    }

    try {
      const payload = JSON.stringify(message);
      this.mqttClient.publish(topic, payload, { qos: 1 }, (error) => {
        if (error) {
          this.logger.error(`Failed to publish to ${topic}:`, error);
        } else {
          this.logger.debug(`✅ Published to ${topic}`);
        }
      });
    } catch (error) {
      this.logger.error(`Error publishing to ${topic}:`, error);
    }
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
    if (this.mqttClient) {
      this.mqttClient.end();
      this.logger.log('MQTT client disconnected');
    }
  }
}
