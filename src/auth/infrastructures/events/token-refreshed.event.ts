// infrastructure/events/token-refreshed.event.ts
export class TokenRefreshedEvent {
  constructor(
    public readonly userId: string,
    public readonly username: string,
    public readonly timestamp: Date = new Date(),
  ) {
    Object.freeze(this);
  }
}
