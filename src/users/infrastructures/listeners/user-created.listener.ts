// backend/src/users/infrastructures/listeners/user-created.listener.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { UserCreatedEvent } from '../events/user-created.event';

@Injectable()
export class UserCreatedListener {
  private readonly logger = new Logger(UserCreatedListener.name);

  @OnEvent('user.created')
  async handleUserCreated(event: UserCreatedEvent) {
    this.logger.log(
      `📝 User created: ${event.username} (ID: ${event.userId}) by administrator`,
    );

    this.logger.debug(
      `ℹ️ Note: Activation email will be sent when user clicks "Aktivasi Akun" button`,
    );
  }
}
