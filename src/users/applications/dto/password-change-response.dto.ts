// users/applications/dto/password-change-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

class UserSummaryDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: string;

  @ApiProperty({ example: 'johndoe' })
  @Expose()
  username: string;
}

export class PasswordChangeResponseDto {
  @ApiProperty({ example: 'Password berhasil diubah' })
  @Expose()
  message: string;

  @ApiProperty({ example: '2023-11-19T10:00:00.000Z' })
  @Expose()
  timestamp: string;

  @ApiProperty({ type: UserSummaryDto, required: false })
  @Expose()
  @Type(() => UserSummaryDto) // Penting untuk nested object transformation
  user?: UserSummaryDto;
}
