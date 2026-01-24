import { UnauthorizedException } from '@nestjs/common';

export class TokenValidator {
  /**
   * Validate token format
   */
  static validateTokenFormat(token: string): void {
    if (!token) {
      throw new UnauthorizedException('Token is required');
    }

    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('Invalid token format');
    }

    // Basic validation of each part
    for (const part of parts) {
      if (!part || part.length === 0) {
        throw new UnauthorizedException('Invalid token structure');
      }
    }
  }

  /**
   * Extract token from Authorization header
   */
  static extractBearerToken(authHeader: string): string {
    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is required');
    }

    // ▼▼▼ PERBAIKAN DIMULAI DI SINI ▼▼▼
    // Gunakan Regex untuk parsing yang lebih kuat:
    // ^Bearer   - Harus dimulai dengan "Bearer"
    // \s+       - Diikuti oleh SATU ATAU LEBIH whitespace (spasi, tab, dll.)
    // (.+)      - Tangkap SEMUA sisa karakter (termasuk "token123 extra")
    const match = authHeader.match(/^Bearer\s+(.+)$/);

    // 'match' akan null jika tidak cocok
    // Jika cocok, 'match[1]' akan berisi token-nya
    const token = match ? match[1] : null;

    if (token) {
      return token; // Sukses, token ditemukan
    }

    // Jika token null (regex gagal), cari tahu kenapa
    // Ini untuk mencocokkan pesan error spesifik yang diharapkan oleh tes Anda

    if (authHeader.startsWith('Bearer')) {
      // Header dimulai dengan "Bearer" tapi malformed
      // (mis: "Bearer", "Bearer ", "Bearer     ")
      // Regex (.+) gagal karena tidak ada *konten* setelah spasi
      throw new UnauthorizedException('Token not provided');
    }

    // Jika tidak dimulai dengan "Bearer" sama sekali
    // (mis: "Basic ...", "bearer ...", "token123")
    throw new UnauthorizedException('Invalid authorization type');
  }
}
