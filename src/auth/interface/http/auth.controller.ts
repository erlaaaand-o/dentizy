import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  UseGuards,
  Req,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';

import { AuthService } from '../../applications/orchestrator/auth.service';
import { LoginDto } from '../../applications/dto/login.dto';
import { VerifyTokenDto } from '../../applications/dto/verify-token.dto';
import { GetUser } from '../decorators/get-user.decorator';
import { User } from '../../../users/domains/entities/user.entity';
import { UsersService } from '../../../users/applications/orchestrator/users.service';
import { UpdateProfileDto } from '../../applications/dto/update-profile.dto';
import { UserResponseDto } from '../../../users/applications/dto/user-response.dto';
import { TokenService } from '../../domains/services/token.service';
import { Public } from '../decorators/public.decorator'; //
import {
  ForgotPasswordRequestDto, // Perhatikan nama DTO-nya (sesuai file users dto)
  VerifyOTPDto,
  ResetPasswordWithTokenDto,
} from '../../../users/applications/dto/forgot-password.dto';

/**
 * Interface untuk response update profile yang include token
 */
interface UpdateProfileResponse extends UserResponseDto {
  access_token: string;
}

/**
 * Interface untuk user tanpa password
 */
interface UserWithoutPassword extends Omit<User, 'password'> {}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
  ) {}

  @Post('login')
  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login pengguna',
    description: 'Autentikasi via email/password dan dapatkan token',
  })
  @ApiResponse({
    status: 200,
    description: 'Login berhasil, mengembalikan token',
    schema: {
      example: {
        access_token: 'jwt.access.token',
        user: {
          id: 1,
          username: 'dokter_tirta',
          nama_lengkap: 'dr. Tirta Mandira',
          roles: ['dokter', 'admin'],
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Email atau password salah' })
  @ApiResponse({ status: 400, description: 'Data tidak valid' })
  @ApiResponse({ status: 429, description: 'Terlalu banyak percobaan login' })
  async login(@Body(ValidationPipe) loginDto: LoginDto, @Req() req: Request) {
    const metadata = {
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('user-agent') || 'unknown',
    };

    return this.authService.login(loginDto, metadata);
  }

  @Post('refresh')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Token berhasil diperbarui',
    schema: {
      example: {
        access_token: 'new.jwt.access.token',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Refresh token tidak valid' })
  async refresh(@GetUser() user: User) {
    return this.authService.refreshToken(user.id);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verifikasi validitas token' })
  @ApiResponse({
    status: 200,
    description: 'Token valid',
    schema: {
      example: {
        valid: true,
        userId: 1,
        username: 'dokter_tirta',
        roles: ['dokter', 'admin'],
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token tidak valid',
    schema: {
      example: {
        valid: false,
        message: 'Token tidak valid atau sudah kadaluarsa',
      },
    },
  })
  async verify(@Body(ValidationPipe) verifyTokenDto: VerifyTokenDto) {
    return this.authService.verifyToken(verifyTokenDto.token);
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout pengguna' })
  @ApiResponse({
    status: 200,
    description: 'Logout berhasil',
    schema: {
      example: { message: 'Logout berhasil' },
    },
  })
  @ApiResponse({ status: 401, description: 'Token tidak valid' })
  async logout(@GetUser() user: User) {
    return this.authService.logout(user.id);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Dapatkan profil pengguna saat ini' })
  @ApiResponse({
    status: 200,
    description: 'Profil pengguna',
    schema: {
      example: {
        id: 1,
        username: 'dokter_tirta',
        nama_lengkap: 'dr. Tirta Mandira',
        roles: [{ id: 1, name: 'dokter' }],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        profile_photo: null,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Token tidak valid' })
  async getProfile(@GetUser() user: User): Promise<UserWithoutPassword> {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  @Patch('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update profil pengguna saat ini' })
  @ApiResponse({
    status: 200,
    description: 'Profil berhasil diupdate, mengembalikan token baru',
    schema: {
      example: {
        id: 1,
        username: 'erland_baru',
        nama_lengkap: 'Erland Agsya Agustian',
        roles: [{ id: 1, name: 'dokter' }],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        profile_photo: null,
        access_token: 'jwt.baru.yang.telah.diperbarui',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Token tidak valid' })
  @ApiResponse({ status: 409, description: 'Username sudah digunakan' })
  async updateMyProfile(
    @GetUser() user: User,
    @Body(ValidationPipe) updateProfileDto: UpdateProfileDto,
  ): Promise<UpdateProfileResponse> {
    // Update user profile
    const updatedUserDto = await this.usersService.update(
      user.id,
      updateProfileDto,
    );

    const tokenPayload = {
      userId: updatedUserDto.id,
      username: updatedUserDto.username,
      roles: updatedUserDto.roles.map((role) => role.name),
    };

    const newAccessToken = this.tokenService.generateToken(tokenPayload);

    return {
      ...updatedUserDto,
      access_token: newAccessToken,
    };
  }

  @Post('forgot-password')
  @Public()
  @ApiOperation({ summary: 'Request OTP untuk reset password' })
  async forgotPassword(@Body() dto: ForgotPasswordRequestDto) {
    return this.usersService.sendOTP(dto.emailOrUsername);
  }

  @Post('verify-otp')
  @Public()
  @ApiOperation({ summary: 'Verifikasi OTP dan dapatkan Reset Token' })
  async verifyOTP(@Body() dto: VerifyOTPDto) {
    return this.usersService.verifyOTP(dto.email, dto.otp);
  }

  @Post('reset-password')
  @Public()
  @ApiOperation({ summary: 'Set password baru menggunakan Reset Token' })
  async resetPassword(@Body() dto: ResetPasswordWithTokenDto) {
    return this.usersService.resetPasswordWithToken(
      dto.resetToken,
      dto.newPassword,
    );
  }
}
