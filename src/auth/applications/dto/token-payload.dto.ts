import { ApiProperty } from '@nestjs/swagger';

export class TokenPayloadDto {
  @ApiProperty({
    description:
      'ID User (biasanya diambil dari claim "sub" atau "id" di token)',
    example: 1,
  })
  userId: string;

  @ApiProperty({
    description: 'Username pengguna',
    example: 'dokter_tirta',
  })
  username: string;

  @ApiProperty({
    description: 'Daftar role atau hak akses yang dimiliki user',
    example: ['dokter', 'admin'],
    type: [String], // Memberitahu Swagger bahwa ini array of strings
  })
  roles: string[];
}
