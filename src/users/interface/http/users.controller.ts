import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
  DefaultValuePipe,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';

import { GetUser } from '../../../auth/interface/decorators/get-user.decorator';
import { Roles } from '../../../auth/interface/decorators/roles.decorator';
import { RolesGuard } from '../../../auth/interface/guards/roles.guard';
import { UserRole } from '../../../roles/entities/role.entity';
import {
  RequestActivationResponseDto,
  VerifyActivationTokenResponseDto,
  ActivateAccountResponseDto,
  CheckActivationStatusResponseDto,
} from '../../applications/dto/account-activation-response.dto';
import {
  RequestActivationDto,
  VerifyActivationTokenDto,
  ActivateAccountDto,
  CheckActivationStatusDto,
} from '../../applications/dto/account-activation.dto';
import { ChangePasswordDto } from '../../applications/dto/change-password.dto';
import { CreateUserDto } from '../../applications/dto/create-user.dto';
import { FindUsersQueryDto } from '../../applications/dto/find-users-query.dto';
import { PasswordChangeResponseDto } from '../../applications/dto/password-change-response.dto';
import { ResetPasswordDto } from '../../applications/dto/reset-password.dto';
import { UpdateUserDto } from '../../applications/dto/update-user.dto';
import { UserResponseDto } from '../../applications/dto/user-response.dto';
import { UsersService } from '../../applications/orchestrator/users.service';
import { User } from '../../domains/entities/user.entity';

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  lastPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface UserListResponse {
  data: UserResponseDto[];
  meta: PaginationMeta;
}

interface DeleteResponse {
  message: string;
}

interface UsernameAvailability {
  available: boolean;
  message: string;
}

interface UserStatistics {
  total: number;
  byRole: Record<string, number>;
  active: number;
  inactive: number;
}

interface TemporaryPasswordResponse {
  temporaryPassword: string;
  message: string;
}

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
@ApiUnauthorizedResponse({ description: 'Token tidak valid atau kadaluarsa' })
@ApiForbiddenResponse({
  description: 'Role user tidak memiliki akses ke endpoint ini',
})
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.KEPALA_KLINIK)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Buat user baru',
    description: 'Hanya KEPALA_KLINIK yang dapat membuat user baru',
  })
  @ApiResponse({
    status: 201,
    description: 'User berhasil dibuat',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Data tidak valid' })
  @ApiResponse({ status: 409, description: 'Username sudah terdaftar' })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.STAF, UserRole.DOKTER, UserRole.KEPALA_KLINIK)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60)
  @ApiOperation({
    summary: 'Daftar semua user dengan pagination dan filter',
    description: 'Mendukung filter: role, search (nama/username), isActive',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Halaman (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Jumlah per halaman (default: 10, max: 100)',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: UserRole,
    description: 'Filter by role',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Cari nama atau username',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by status aktif',
  })
  @ApiResponse({
    status: 200,
    description: 'Daftar user berhasil diambil',
  })
  async findAll(@Query() query: FindUsersQueryDto): Promise<UserListResponse> {
    return this.usersService.findAll(query);
  }

  @Get('statistics')
  @Roles(UserRole.KEPALA_KLINIK)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300)
  @ApiOperation({ summary: 'Statistik user untuk dashboard' })
  @ApiResponse({
    status: 200,
    description: 'Statistik user',
    schema: {
      example: {
        total: 150,
        byRole: {
          DOKTER: 20,
          STAF: 100,
          KEPALA_KLINIK: 5,
        },
        active: 145,
        inactive: 5,
      },
    },
  })
  async getStatistics(): Promise<UserStatistics> {
    return this.usersService.getUserStatistics();
  }

  @Get('recent')
  @Roles(UserRole.STAF, UserRole.KEPALA_KLINIK)
  @ApiOperation({ summary: 'User yang baru dibuat' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Jumlah user (default: 10, max: 50)',
  })
  @ApiResponse({
    status: 200,
    description: 'Daftar user terbaru',
    type: [UserResponseDto],
  })
  async getRecentUsers(
    @Query('limit', new DefaultValuePipe(10)) limit: number,
  ): Promise<UserResponseDto[]> {
    if (limit < 1 || limit > 50) {
      throw new BadRequestException('Limit harus antara 1 dan 50');
    }
    return this.usersService.getRecentlyCreated(limit);
  }

  @Get('check-username/:username')
  @Roles(UserRole.STAF, UserRole.KEPALA_KLINIK)
  @ApiOperation({ summary: 'Cek ketersediaan username' })
  @ApiParam({ name: 'username', description: 'Username yang akan dicek' })
  @ApiResponse({
    status: 200,
    description: 'Status ketersediaan username',
    schema: {
      example: {
        available: true,
        message: 'Username "johndoe" tersedia',
      },
    },
  })
  async checkUsername(
    @Param('username') username: string,
  ): Promise<UsernameAvailability> {
    return this.usersService.checkUsernameAvailability(username);
  }

  @Get(':id')
  @Roles(UserRole.STAF, UserRole.KEPALA_KLINIK)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300)
  @ApiOperation({ summary: 'Detail user by ID' })
  @ApiParam({ name: 'id', description: 'ID User' })
  @ApiResponse({
    status: 200,
    description: 'Detail user',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User tidak ditemukan' })
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.KEPALA_KLINIK)
  @ApiOperation({
    summary: 'Update data user',
    description:
      'Hanya KEPALA_KLINIK yang dapat update. Field opsional: nama_lengkap, username, roles',
  })
  @ApiParam({ name: 'id', description: 'ID User' })
  @ApiResponse({
    status: 200,
    description: 'User berhasil diupdate',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User tidak ditemukan' })
  @ApiResponse({ status: 409, description: 'Username sudah digunakan' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.KEPALA_KLINIK)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Hapus user',
    description: 'Hanya KEPALA_KLINIK yang dapat menghapus user',
  })
  @ApiParam({ name: 'id', description: 'ID User' })
  @ApiResponse({
    status: 200,
    description: 'User berhasil dihapus',
    schema: {
      example: { message: 'User johndoe berhasil dihapus' },
    },
  })
  @ApiResponse({ status: 404, description: 'User tidak ditemukan' })
  async remove(@Param('id') id: string): Promise<DeleteResponse> {
    return this.usersService.remove(id);
  }

  @Post('change-password')
  @Roles(UserRole.DOKTER, UserRole.STAF, UserRole.KEPALA_KLINIK)
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @ApiOperation({
    summary: 'Ganti password sendiri',
    description:
      'User yang terautentikasi dapat mengganti password mereka sendiri. Memerlukan password lama, password baru, dan konfirmasi.',
  })
  @ApiResponse({
    status: 200,
    description: 'Password berhasil diubah',
    type: PasswordChangeResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Password lama salah, password tidak valid, atau konfirmasi tidak sesuai',
  })
  async changePassword(
    @GetUser() user: User,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<PasswordChangeResponseDto> {
    return this.usersService.changePassword(
      user.id,
      changePasswordDto.oldPassword,
      changePasswordDto.newPassword,
    );
  }

  @Post(':id/reset-password')
  @Roles(UserRole.KEPALA_KLINIK)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password user (admin)',
    description:
      'Hanya KEPALA_KLINIK yang dapat mereset password user lain. Tidak memerlukan password lama.',
  })
  @ApiParam({ name: 'id', description: 'ID User' })
  @ApiResponse({
    status: 200,
    description: 'Password berhasil direset',
    type: PasswordChangeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User tidak ditemukan' })
  async resetPassword(
    @Param('id') id: string,
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<PasswordChangeResponseDto> {
    return this.usersService.resetPassword(id, resetPasswordDto.newPassword);
  }

  @Post(':id/generate-temp-password')
  @Roles(UserRole.KEPALA_KLINIK)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate password temporary',
    description:
      'Hanya KEPALA_KLINIK yang dapat generate password temporary untuk user. Password akan di-generate otomatis dan memenuhi kebijakan keamanan.',
  })
  @ApiParam({ name: 'id', description: 'ID User' })
  @ApiResponse({
    status: 200,
    description: 'Password temporary berhasil dibuat',
    schema: {
      example: {
        temporaryPassword: 'Abc123!@#Xyz',
        message: 'Password sementara berhasil dibuat untuk johndoe',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User tidak ditemukan' })
  async generateTempPassword(
    @Param('id') id: string,
  ): Promise<TemporaryPasswordResponse> {
    return this.usersService.generateTemporaryPassword(id);
  }

  @Post('activation/check-status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cek status aktivasi akun',
    description: 'Mengecek apakah akun pengguna telah diaktivasi atau belum',
  })
  @ApiResponse({
    status: 200,
    description: 'Status aktivasi akun berhasil diperiksa',
    type: CheckActivationStatusResponseDto,
  })
  async checkActivationStatus(
    @Body() dto: CheckActivationStatusDto,
  ): Promise<CheckActivationStatusResponseDto> {
    return this.usersService.checkActivationStatus(dto.usernameOrEmail);
  }

  /**
   * Step 1: Request activation email (user clicks "Aktivasi Akun")
   * Public endpoint
   */
  @Post('activation/request')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard) // Rate limiting
  @ApiOperation({
    summary: 'Request email aktivasi akun',
    description:
      'User klik tombol "Aktivasi Akun" → sistem kirim email dengan link aktivasi.',
  })
  @ApiResponse({
    status: 200,
    description: 'Email aktivasi berhasil dikirim',
    type: RequestActivationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Akun sudah aktif atau tidak memiliki email',
  })
  @ApiResponse({
    status: 404,
    description: 'User tidak ditemukan',
  })
  @ApiResponse({
    status: 429,
    description: 'Terlalu banyak request, coba lagi nanti',
  })
  async requestActivation(
    @Body() dto: RequestActivationDto,
  ): Promise<RequestActivationResponseDto> {
    return this.usersService.sendActivationEmail(dto.usernameOrEmail);
  }

  @Post('activation/resend')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @ApiOperation({
    summary: 'Kirim ulang email aktivasi',
    description:
      'Jika user tidak menerima email aktivasi, kirim ulang link aktivasi.',
  })
  @ApiResponse({
    status: 200,
    description: 'Email aktivasi berhasil dikirim ulang',
    type: RequestActivationResponseDto,
  })
  async resendActivation(
    @Body() dto: RequestActivationDto,
  ): Promise<RequestActivationResponseDto> {
    return this.usersService.resendActivationEmail(dto.usernameOrEmail);
  }

  @Post('activation/verify-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verifikasi token aktivasi',
    description:
      'Verifikasi apakah token aktivasi masih valid (untuk validasi frontend sebelum user input password)',
  })
  @ApiResponse({
    status: 200,
    description: 'Status token',
    type: VerifyActivationTokenResponseDto,
  })
  async verifyActivationToken(
    @Body() dto: VerifyActivationTokenDto,
  ): Promise<VerifyActivationTokenResponseDto> {
    return this.usersService.verifyActivationToken(dto.token);
  }

  @Post('activation/activate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @ApiOperation({
    summary: 'Aktivasi akun dengan password baru',
    description:
      'User set password baru untuk mengaktifkan akun. Setelah ini, user bisa login.',
  })
  @ApiResponse({
    status: 200,
    description: 'Akun berhasil diaktivasi',
    type: ActivateAccountResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Token tidak valid, sudah kedaluwarsa, atau akun sudah aktif',
  })
  async activateAccount(
    @Body() dto: ActivateAccountDto,
  ): Promise<ActivateAccountResponseDto> {
    return this.usersService.activateAccount(dto.token);
  }
}
