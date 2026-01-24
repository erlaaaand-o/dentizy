export interface IFingerprintDevice {
  /**
   * Initialize device connection
   */
  connect(): Promise<boolean>;

  /**
   * Disconnect from device
   */
  disconnect(): Promise<void>;

  /**
   * Capture fingerprint from device
   */
  capture(): Promise<string>; // Returns Base64 template

  /**
   * Match two fingerprint templates
   * Returns match score (0-100)
   */
  match(template1: string, template2: string): Promise<number>;

  /**
   * Get device information
   */
  getDeviceInfo(): Promise<{
    id: string;
    model: string;
    version: string;
    status: string;
  }>;

  /**
   * Check if device is connected
   */
  isConnected(): boolean;
}
