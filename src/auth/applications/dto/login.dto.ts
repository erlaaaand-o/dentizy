import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'username pengguna',
    example: 'siti.kepala',
  })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({
    description: 'Password akun',
    example: 'developerganteng',
    // format: 'password' akan membuat input field di Swagger UI
    // menampilkan bintang (***) saat diketik, bukan teks biasa.
    format: 'password',
  })
  @IsNotEmpty()
  @IsString()
  password: string;
}
