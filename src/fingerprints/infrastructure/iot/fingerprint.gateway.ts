import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';
import { FingerprintEnrolledEvent } from '../events/fingerprint-enrolled.event';
import { FingerprintVerifiedEvent } from '../events/fingerprint-verified.event';
import { FingerprintFailedEvent } from '../events/fingerprint-failed.event';

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

  afterInit(server: Server) {
    this.logger.log('🚀 WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
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

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.log(
      `👋 Client disconnected: ${client.id} (Total: ${this.connectedClients.size})`,
    );
  }

  @SubscribeMessage('subscribe:patient')
  handleSubscribePatient(client: Socket, patientId: number) {
    const room = `patient:${patientId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} subscribed to ${room}`);

    client.emit('subscribed', {
      room,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('unsubscribe:patient')
  handleUnsubscribePatient(client: Socket, patientId: number) {
    const room = `patient:${patientId}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} unsubscribed from ${room}`);
  }

  @SubscribeMessage('ping')
  handlePing(client: Socket) {
    client.emit('pong', { timestamp: new Date() });
  }

  // Event handlers
  @OnEvent('fingerprint.enrolled')
  handleFingerprintEnrolled(event: FingerprintEnrolledEvent) {
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
  handleFingerprintVerified(event: FingerprintVerifiedEvent) {
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
  handleFingerprintFailed(event: FingerprintFailedEvent) {
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
  broadcastDeviceStatus(status: any) {
    this.server.emit('device:status', {
      ...status,
      timestamp: new Date(),
    });
  }

  /**
   * Send message to specific client
   */
  sendToClient(clientId: string, event: string, data: any) {
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
