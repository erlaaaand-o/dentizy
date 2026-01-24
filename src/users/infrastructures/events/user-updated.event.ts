// infrastructure/events/user-updated.event.ts

/**
 * Type for tracking changes made to user
 * Represents possible values that can be changed in user entity
 */
export type UserChangeValue = string | string[] | null | undefined;

/**
 * Interface for user changes
 * Maps field names to their new values
 */
export interface UserChanges {
  username?: string;
  nama_lengkap?: string;
  email?: string | null;
  password?: string; // Will be masked as '***CHANGED***'
  roles?: string[];
  [key: string]: UserChangeValue;
}

/**
 * Event emitted when a user is updated
 */
export class UserUpdatedEvent {
  constructor(
    public readonly userId: string,
    public readonly username: string,
    public readonly changes: UserChanges,
    public readonly timestamp: Date = new Date(),
  ) {}

  /**
   * Get list of changed field names
   */
  getChangedFields(): string[] {
    return Object.keys(this.changes);
  }

  /**
   * Check if specific field was changed
   */
  hasFieldChanged(fieldName: string): boolean {
    return fieldName in this.changes;
  }

  /**
   * Check if sensitive data was changed
   */
  hasSensitiveChanges(): boolean {
    return this.hasFieldChanged('password') || this.hasFieldChanged('email');
  }
}
