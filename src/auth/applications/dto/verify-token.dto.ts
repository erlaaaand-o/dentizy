import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyTokenDto {
  @ApiProperty({
    description: 'Token JWT string yang ingin dicek validitasnya',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInVzZXJuYW1lIj...',
  })
  @IsNotEmpty()
  @IsString()
  token: string;
}

export class VerifyTokenResponseDto {
  @ApiProperty({
    description: 'Indikator apakah token valid atau tidak',
    example: true,
  })
  valid: boolean;

  @ApiPropertyOptional({
    description: 'ID User (Hanya muncul jika token valid)',
    example: 1,
  })
  userId?: string;

  @ApiPropertyOptional({
    description: 'Username (Hanya muncul jika token valid)',
    example: 'dokter_tirta',
  })
  username?: string;

  @ApiPropertyOptional({
    description: 'List Role (Hanya muncul jika token valid)',
    example: ['dokter', 'admin'],
  })
  roles?: string[];

  @ApiPropertyOptional({
    description: 'Pesan error/info (Biasanya muncul jika token invalid)',
    example: 'Token has expired',
  })
  message?: string;
}
