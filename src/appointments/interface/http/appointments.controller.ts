import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
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
import { AppointmentsService } from '../../applications/orchestrator/appointments.service';
import { CreateAppointmentDto } from '../../applications/dto/create-appointment.dto';
import { UpdateAppointmentDto } from '../../applications/dto/update-appointment.dto';
import { FindAppointmentsQueryDto } from '../../applications/dto/find-appointments-query.dto';
import {
  AppointmentResponseDto,
  PaginatedAppointmentResponseDto,
} from '../../applications/dto/appointment-response.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../../auth/interface/guards/roles.guard';
import { Roles } from '../../../auth/interface/decorators/roles.decorator';
import { UserRole } from '../../../roles/entities/role.entity';
import { GetUser } from '../../../auth/interface/decorators/get-user.decorator';
import { User } from '../../../users/domains/entities/user.entity';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';

@ApiTags('Appointments')
@ApiBearerAuth('access-token')
@Controller('appointments')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
@ApiUnauthorizedResponse({ description: 'Token tidak valid atau kadaluarsa' })
@ApiForbiddenResponse({
  description: 'Role user tidak memiliki akses ke endpoint ini',
})
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Roles(UserRole.STAF, UserRole.KEPALA_KLINIK)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Buat appointment baru',
    description:
      'Membuat janji temu baru dengan validasi waktu dan conflict detection',
  })
  @ApiResponse({
    status: 201,
    description: 'Appointment berhasil dibuat',
    type: AppointmentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Data tidak valid' })
  @ApiResponse({
    status: 404,
    description: 'Pasien atau dokter tidak ditemukan',
  })
  @ApiResponse({
    status: 409,
    description: 'Konflik jadwal dengan appointment lain',
  })
  async create(
    @Body(ValidationPipe) createDto: CreateAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    return await this.appointmentsService.create(createDto);
  }

  @Post(':id/complete')
  @Roles(UserRole.DOKTER, UserRole.KEPALA_KLINIK)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Selesaikan appointment',
    description: 'Mengubah status appointment menjadi SELESAI',
  })
  @ApiParam({ name: 'id', description: 'ID Appointment' })
  @ApiResponse({
    status: 200,
    description: 'Appointment berhasil diselesaikan',
    type: AppointmentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Appointment tidak ditemukan' })
  @ApiResponse({ status: 403, description: 'Tidak memiliki akses' })
  @ApiResponse({
    status: 409,
    description: 'Status tidak valid untuk diselesaikan',
  })
  async complete(
    @Param('id') id: string,
    @GetUser() user: User,
  ): Promise<AppointmentResponseDto> {
    return await this.appointmentsService.complete(id, user);
  }

  @Post(':id/cancel')
  @Roles(UserRole.STAF, UserRole.DOKTER, UserRole.KEPALA_KLINIK)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Batalkan appointment',
    description:
      'Membatalkan appointment dengan validasi business rules (< 24 jam hanya Kepala Klinik)',
  })
  @ApiParam({ name: 'id', description: 'ID Appointment' })
  @ApiResponse({
    status: 200,
    description: 'Appointment berhasil dibatalkan',
    type: AppointmentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Appointment tidak ditemukan' })
  @ApiResponse({
    status: 403,
    description: 'Tidak memiliki akses atau pembatalan < 24 jam',
  })
  @ApiResponse({
    status: 409,
    description: 'Status tidak valid untuk dibatalkan',
  })
  async cancel(
    @Param('id') id: string,
    @GetUser() user: User,
  ): Promise<AppointmentResponseDto> {
    return await this.appointmentsService.cancel(id, user);
  }

  @Get()
  @Roles(UserRole.STAF, UserRole.DOKTER, UserRole.KEPALA_KLINIK)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60)
  @ApiOperation({
    summary: 'Daftar appointments dengan filter',
    description: 'Mengambil daftar appointments dengan pagination dan filter',
  })
  @ApiQuery({
    name: 'doctorId',
    required: false,
    type: Number,
    description: 'Filter by Doctor ID',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    type: String,
    description: 'Filter by Date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['dijadwalkan', 'selesai', 'dibatalkan'],
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiResponse({
    status: 200,
    description: 'Daftar appointments',
    type: PaginatedAppointmentResponseDto,
  })
  async findAll(
    @GetUser() user: User,
    @Query(ValidationPipe) queryDto: FindAppointmentsQueryDto,
  ): Promise<PaginatedAppointmentResponseDto> {
    return await this.appointmentsService.findAll(user, queryDto);
  }

  @Get(':id')
  @Roles(UserRole.STAF, UserRole.DOKTER, UserRole.KEPALA_KLINIK)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300)
  @ApiOperation({
    summary: 'Detail appointment by ID',
    description: 'Mengambil detail appointment berdasarkan ID',
  })
  @ApiParam({ name: 'id', description: 'ID Appointment' })
  @ApiResponse({
    status: 200,
    description: 'Detail appointment',
    type: AppointmentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Appointment tidak ditemukan' })
  @ApiResponse({ status: 403, description: 'Tidak memiliki akses' })
  async findOne(
    @Param('id') id: string,
    @GetUser() user: User,
  ): Promise<AppointmentResponseDto> {
    return await this.appointmentsService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(UserRole.STAF, UserRole.KEPALA_KLINIK) // Pastikan role sesuai kebutuhan bisnis
  @ApiOperation({
    summary: 'Update appointment',
    description:
      'Mengupdate data appointment. Jika status SELESAI & ada medical_record, akan memicu transaksi rekam medis.',
  })
  @ApiParam({ name: 'id', description: 'ID Appointment' })
  @ApiResponse({
    status: 200,
    description: 'Appointment berhasil diupdate',
    type: AppointmentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Appointment tidak ditemukan' })
  @ApiResponse({ status: 400, description: 'Data tidak valid' })
  @ApiResponse({
    status: 409,
    description: 'Konflik jadwal atau status tidak valid',
  })
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateDto: UpdateAppointmentDto,
    @GetUser() user: User, // [BARU] Inject User dari token JWT
  ): Promise<AppointmentResponseDto> {
    // [BARU] Teruskan 'user' ke service
    return await this.appointmentsService.update(id, updateDto, user);
  }

  @Delete(':id')
  @Roles(UserRole.STAF, UserRole.KEPALA_KLINIK)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Hapus appointment',
    description: 'Menghapus appointment (hanya jika belum ada medical record)',
  })
  @ApiParam({ name: 'id', description: 'ID Appointment' })
  @ApiResponse({
    status: 200,
    description: 'Appointment berhasil dihapus',
    schema: {
      example: { message: 'Appointment berhasil dihapus' },
    },
  })
  @ApiResponse({ status: 404, description: 'Appointment tidak ditemukan' })
  @ApiResponse({
    status: 409,
    description: 'Tidak bisa dihapus karena sudah ada medical record',
  })
  async remove(
    @Param('id') id: string,
    @GetUser() user: User,
  ): Promise<{ message: string }> {
    await this.appointmentsService.remove(id, user);
    return { message: 'Appointment berhasil dihapus' };
  }
}
