import { ApiProperty } from '@nestjs/swagger';

// 1. Definisikan struktur User sebagai Class terpisah (Sub-DTO)
// Ini agar Swagger bisa membaca properti di dalamnya (id, username, dll)
class LoginUserDto {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: 'dokter_tirta' })
  username: string;

  @ApiProperty({ example: 'dr. Tirta Mandira' })
  nama_lengkap: string;

  // Untuk array string, swagger biasanya otomatis mendeteksi,
  // tapi memberi contoh (example) sangat membantu frontend
  @ApiProperty({ example: ['dokter', 'admin'] })
  roles: string[];
}

// 2. DTO Utama
export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT Token untuk otentikasi (Bearer Token)',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInVzZXJuYW1lIj...',
  })
  access_token: string;

  @ApiProperty({
    description: 'Informasi user yang sedang login',
    type: LoginUserDto, // Mengarahkan Swagger untuk membaca skema LoginUserDto
  })
  user: LoginUserDto;
}
