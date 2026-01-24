// infrastructure/events/user-deleted.event.ts

/**
 * Event emitted when a user is deleted
 */
export class UserDeletedEvent {
  constructor(
    public readonly userId: string,
    public readonly username: string,
    public readonly timestamp: Date = new Date(),
  ) {}

  /**
   * Get formatted message for logging
   */
  getLogMessage(): string {
    return `User ${this.username} (ID: ${this.userId}) was deleted at ${this.timestamp.toISOString()}`;
  }
}
