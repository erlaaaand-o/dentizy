import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { PublicBookingService } from '../../applications/use-cases/public-booking.service';
import { PublicBookingDto } from '../../applications/dto/public-booking.dto';
import { AppointmentResponseDto } from '../../applications/dto/appointment-response.dto';
import { UsersService } from '../../../users/applications/orchestrator/users.service';
import { UserRole } from '../../../roles/entities/role.entity';
import { FindUsersQueryDto } from '../../../users/applications/dto/find-users-query.dto';

/**
 * Interface untuk doctor response yang simplified
 */
interface DoctorPublicInfo {
  id: string;
  nama_lengkap: string;
}

@ApiTags('Public Appointments')
@Controller('public/appointments')
@UseGuards(ThrottlerGuard)
export class PublicAppointmentsController {
  constructor(
    private readonly publicBookingService: PublicBookingService,
    private readonly usersService: UsersService,
  ) {}

  @Get('doctors')
  @ApiOperation({ summary: 'Dapatkan daftar dokter dan kepala klinik aktif' })
  @ApiResponse({
    status: 200,
    description: 'List dokter berhasil diambil',
    schema: {
      example: [
        { id: 1, nama_lengkap: 'dr. John Doe' },
        { id: 2, nama_lengkap: 'dr. Jane Smith' },
      ],
    },
  })
  async getDoctors(): Promise<DoctorPublicInfo[]> {
    // Create query DTOs with proper typing
    const doctorQuery: FindUsersQueryDto = {
      role: UserRole.DOKTER,
      isActive: true,
      page: 1,
      limit: 100,
    };

    const kepalaKlinikQuery: FindUsersQueryDto = {
      role: UserRole.KEPALA_KLINIK,
      isActive: true,
      page: 1,
      limit: 100,
    };

    // Fetch doctors and clinic heads in parallel
    const [doctors, heads] = await Promise.all([
      this.usersService.findAll(doctorQuery),
      this.usersService.findAll(kepalaKlinikQuery),
    ]);

    // Combine and map to simplified structure
    const allDoctors = [...doctors.data, ...heads.data];

    // Sort alphabetically
    allDoctors.sort((a, b) => a.nama_lengkap.localeCompare(b.nama_lengkap));

    // Map to public info only (id and nama_lengkap)
    return allDoctors.map(
      (user): DoctorPublicInfo => ({
        id: user.id,
        nama_lengkap: user.nama_lengkap,
      }),
    );
  }

  @Post('book')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Booking janji temu untuk pasien umum (Tanpa Login)',
    description:
      'Jika NIK baru, akan membuat data pasien sementara (perlu verifikasi di klinik).',
  })
  @ApiResponse({
    status: 201,
    description: 'Booking berhasil',
    type: AppointmentResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Konflik jadwal atau data pasien tidak valid',
  })
  @ApiResponse({ status: 400, description: 'Input tidak valid' })
  @ApiResponse({
    status: 429,
    description: 'Terlalu banyak permintaan (rate limit)',
  })
  async book(@Body() dto: PublicBookingDto): Promise<AppointmentResponseDto> {
    const appointment = await this.publicBookingService.execute(dto);

    // Map to response DTO
    return {
      id: appointment.id,
      patient_id: appointment.patient_id,
      doctor_id: appointment.doctor_id,
      status: appointment.status,
      tanggal_janji: appointment.tanggal_janji,
      jam_janji: appointment.jam_janji,
      keluhan: appointment.keluhan,
      created_at: appointment.created_at,
      updated_at: appointment.updated_at,
      patient: appointment.patient
        ? {
            id: appointment.patient.id,
            nama_lengkap: appointment.patient.nama_lengkap,
            nomor_rekam_medis: appointment.patient.nomor_rekam_medis,
            nik: appointment.patient.nik,
            is_active: appointment.patient.is_active,
            email: appointment.patient.email ?? undefined,
            nomor_telepon: appointment.patient.no_hp ?? undefined,
          }
        : undefined,
      doctor: appointment.doctor
        ? {
            id: appointment.doctor.id,
            nama_lengkap: appointment.doctor.nama_lengkap,
            roles: appointment.doctor.roles?.map((role) => role.name),
          }
        : undefined,
    };
  }
}
