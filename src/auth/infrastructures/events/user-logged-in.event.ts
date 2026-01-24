// infrastructure/events/user-logged-in.event.ts
export class UserLoggedInEvent {
  constructor(
    public readonly userId: string,
    public readonly username: string,
    public readonly timestamp: Date = new Date(),
    public readonly ipAddress?: string,
    public readonly userAgent?: string,
  ) {
    Object.freeze(this);
  }
}
