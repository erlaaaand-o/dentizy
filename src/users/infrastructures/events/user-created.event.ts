// infrastructure/events/user-created.event.ts

/**
 * Event emitted when a new user is created
 */
export class UserCreatedEvent {
  constructor(
    public readonly userId: string,
    public readonly username: string,
    public readonly nama_lengkap: string,
    public readonly roles: string[],
    public readonly timestamp: Date = new Date(),
  ) {}

  /**
   * Get primary role (first role in array)
   */
  getPrimaryRole(): string | undefined {
    return this.roles[0];
  }

  /**
   * Check if user has specific role
   */
  hasRole(roleName: string): boolean {
    return this.roles.includes(roleName);
  }

  /**
   * Check if user has multiple roles
   */
  hasMultipleRoles(): boolean {
    return this.roles.length > 1;
  }
}
