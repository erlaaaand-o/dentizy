// backend/src/auth/infrastructures/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../../users/applications/orchestrator/users.service';
import { User } from '../../../users/domains/entities/user.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('JWT_SECRET'),
    });
  }

  /**
   * Method ini akan dijalankan secara otomatis oleh NestJS
   * SETELAH token berhasil diverifikasi.
   * `payload` adalah isi dari token yang sudah di-decode.
   */
  async validate(payload: { sub: string; username: string }): Promise<User> {
    // ✅ Gunakan findOneForAuth() yang return User entity (bukan DTO)
    // Ini penting karena Passport Strategy membutuhkan full User entity
    const user = await this.usersService.findOneForAuth(payload.sub);

    if (!user) {
      // Jika pengguna tidak ditemukan (misalnya sudah dihapus), tolak akses
      throw new UnauthorizedException(
        'Token tidak valid atau pengguna tidak ditemukan.',
      );
    }

    // Data yang kita return di sini akan otomatis ditambahkan oleh Passport
    // ke dalam objek `request` di setiap controller.
    // Inilah yang membuat decorator `@GetUser()` bisa bekerja.
    return user;
  }
}
