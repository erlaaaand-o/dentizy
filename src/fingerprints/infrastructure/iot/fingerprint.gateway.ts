import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { FingerprintEnrolledEvent } from '../events/fingerprint-enrolled.event';
import { FingerprintFailedEvent } from '../events/fingerprint-failed.event';
import { FingerprintVerifiedEvent } from '../events/fingerprint-verified.event';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/fingerprint',
})
export class FingerprintGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(FingerprintGateway.name);
  private connectedClients = new Map<string, Socket>();

  afterInit(): void {
    this.logger.log('🚀 WebSocket Gateway initialized');
  }

  handleConnection(client: Socket): void {
    this.connectedClients.set(client.id, client);
    this.logger.log(
      `👤 Client connected: ${client.id} (Total: ${this.connectedClients.size})`,
    );

    // Send connection confirmation
    client.emit('connected', {
      clientId: client.id,
      timestamp: new Date(),
    });
  }

  handleDisconnect(client: Socket): void {
    this.connectedClients.delete(client.id);
    this.logger.log(
      `👋 Client disconnected: ${client.id} (Total: ${this.connectedClients.size})`,
    );
  }

  @SubscribeMessage('subscribe:patient')
  handleSubscribePatient(
    @ConnectedSocket() client: Socket,
    @MessageBody() patientId: string, // Menggunakan string agar konsisten dengan UUID patient
  ): void {
    const room = `patient:${patientId}`;
    void client.join(room); // void untuk menangani Promise dari join (jika ada)
    this.logger.log(`Client ${client.id} subscribed to ${room}`);

    client.emit('subscribed', {
      room,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('unsubscribe:patient')
  handleUnsubscribePatient(
    @ConnectedSocket() client: Socket,
    @MessageBody() patientId: string,
  ): void {
    const room = `patient:${patientId}`;
    void client.leave(room);
    this.logger.log(`Client ${client.id} unsubscribed from ${room}`);
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket): void {
    client.emit('pong', { timestamp: new Date() });
  }

  // Event handlers
  @OnEvent('fingerprint.enrolled')
  handleFingerprintEnrolled(event: FingerprintEnrolledEvent): void {
    const payload = event.payload;

    // Broadcast to all clients
    this.server.emit('fingerprint:enrolled', payload);

    // Send to specific patient room
    this.server
      .to(`patient:${payload.patientId}`)
      .emit('fingerprint:enrolled', payload);

    this.logger.debug(
      `📢 Broadcasting enrollment: Patient #${payload.patientId}`,
    );
  }

  @OnEvent('fingerprint.verified')
  handleFingerprintVerified(event: FingerprintVerifiedEvent): void {
    const payload = event.payload;

    // Broadcast to all clients
    this.server.emit('fingerprint:verified', payload);

    // Send to specific patient room
    this.server
      .to(`patient:${payload.patientId}`)
      .emit('fingerprint:verified', payload);

    this.logger.debug(
      `📢 Broadcasting verification: Patient #${payload.patientId}`,
    );
  }

  @OnEvent('fingerprint.failed')
  handleFingerprintFailed(event: FingerprintFailedEvent): void {
    const payload = event.payload;

    // Broadcast to all clients
    this.server.emit('fingerprint:failed', payload);

    if (payload.patientId) {
      this.server
        .to(`patient:${payload.patientId}`)
        .emit('fingerprint:failed', payload);
    }

    this.logger.debug(`📢 Broadcasting failure`);
  }

  /**
   * Broadcast device status update
   */
  broadcastDeviceStatus(status: Record<string, unknown>): void {
    this.server.emit('device:status', {
      ...status,
      timestamp: new Date(),
    });
  }

  /**
   * Send message to specific client
   */
  sendToClient<T = unknown>(clientId: string, event: string, data: T): void {
    const client = this.connectedClients.get(clientId);
    if (client) {
      client.emit(event, data);
    }
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }
}
