// infrastructure/events/password-changed.event.ts

/**
 * Type for identifying who changed the password
 */
export type PasswordChangeActor = 'self' | 'admin';

/**
 * Event emitted when user password is changed
 */
export class PasswordChangedEvent {
  constructor(
    public readonly userId: string,
    public readonly username: string,
    public readonly changedBy: PasswordChangeActor,
    public readonly timestamp: Date = new Date(),
  ) {}

  /**
   * Check if password was changed by user themselves
   */
  isSelfChange(): boolean {
    return this.changedBy === 'self';
  }

  /**
   * Check if password was changed by admin
   */
  isAdminReset(): boolean {
    return this.changedBy === 'admin';
  }

  /**
   * Get formatted message for logging
   */
  getLogMessage(): string {
    const actor = this.isSelfChange() ? 'themselves' : 'an administrator';
    return `Password for user ${this.username} (ID: ${this.userId}) was changed by ${actor}`;
  }

  /**
   * Get security level indicator
   * Self changes are less risky than admin resets
   */
  getSecurityLevel(): 'low' | 'medium' {
    return this.isSelfChange() ? 'low' : 'medium';
  }
}
