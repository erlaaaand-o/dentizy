// interface/http/medical_records.controller.ts
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
import { MedicalRecordsService } from '../../applications/orchestrator/medical_records.service';
import { CreateMedicalRecordDto } from '../../applications/dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from '../../applications/dto/update-medical-record.dto';
import { SearchMedicalRecordDto } from '../../applications/dto/search-medical-record.dto';
import { MedicalRecordResponseDto } from '../../applications/dto/medical-record-response.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../../auth/interface/guards/roles.guard';
import { Roles } from '../../../auth/interface/decorators/roles.decorator';
import { UserRole } from '../../../roles/entities/role.entity';
import { GetUser } from '../../../auth/interface/decorators/get-user.decorator';
import { User } from '../../../users/domains/entities/user.entity';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { ThrottlerGuard } from '@nestjs/throttler';

interface MessageResponse {
  message: string;
  count?: number;
}

interface DoctorStatsResponse {
  statusCode: number;
  message: string;
  data: unknown[];
}

@ApiTags('Medical Records')
@ApiBearerAuth('access-token')
@Controller('medical-records')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
@ApiUnauthorizedResponse({ description: 'Token tidak valid atau kadaluarsa' })
@ApiForbiddenResponse({
  description: 'Role user tidak memiliki akses ke endpoint ini',
})
export class MedicalRecordsController {
  constructor(private readonly medicalRecordsService: MedicalRecordsService) {}

  @Post()
  @Roles(UserRole.DOKTER, UserRole.STAF, UserRole.KEPALA_KLINIK)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Buat rekam medis baru',
    description: 'Membuat catatan rekam medis baru untuk sebuah appointment',
  })
  @ApiResponse({
    status: 201,
    description: 'Rekam medis berhasil dibuat',
    type: MedicalRecordResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Data tidak valid' })
  async create(
    @Body(ValidationPipe) createDto: CreateMedicalRecordDto,
    @GetUser() user: User,
  ): Promise<MedicalRecordResponseDto> {
    return await this.medicalRecordsService.create(createDto, user);
  }

  @Get()
  @Roles(UserRole.DOKTER, UserRole.STAF, UserRole.KEPALA_KLINIK)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60)
  @ApiOperation({ summary: 'Daftar semua rekam medis (pagination)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Daftar rekam medis',
    schema: {
      example: {
        data: [],
        total: 100,
        page: 1,
        limit: 10,
      },
    },
  })
  async findAll(
    @Query(new ValidationPipe({ transform: true }))
    query: SearchMedicalRecordDto,
    @GetUser() user: User,
  ) {
    return await this.medicalRecordsService.findAll(user, query);
  }

  @Get('search')
  @Roles(UserRole.DOKTER, UserRole.STAF, UserRole.KEPALA_KLINIK)
  @UseGuards(ThrottlerGuard)
  @ApiOperation({
    summary: 'Pencarian rekam medis',
    description: 'Pencarian multi-field: diagnosa, terapi, resep, dll.',
  })
  @ApiResponse({
    status: 200,
    description: 'Hasil pencarian rekam medis',
    type: [MedicalRecordResponseDto],
  })
  async search(
    @Query(ValidationPipe) filters: SearchMedicalRecordDto,
    @GetUser() user: User,
  ) {
    return await this.medicalRecordsService.search(filters, user);
  }

  @Get('by-appointment/:appointmentId')
  @Roles(UserRole.DOKTER, UserRole.STAF, UserRole.KEPALA_KLINIK)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(120)
  @ApiOperation({ summary: 'Cari rekam medis by ID Appointment' })
  @ApiParam({ name: 'appointmentId', description: 'ID Appointment' })
  @ApiResponse({
    status: 200,
    description: 'Detail rekam medis',
    type: MedicalRecordResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Rekam medis tidak ditemukan' })
  async findByAppointmentId(
    @Param('appointmentId') appointmentId: string,
    @GetUser() user: User,
  ): Promise<MedicalRecordResponseDto | null> {
    return await this.medicalRecordsService.findByAppointmentId(
      appointmentId,
      user,
    );
  }

  @Get('stats/doctors')
  @Roles(UserRole.KEPALA_KLINIK, UserRole.STAF)
  @ApiOperation({ summary: 'Statistik kinerja dokter' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getDoctorStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<DoctorStatsResponse> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const data = await this.medicalRecordsService.getDoctorStatistics(
      start,
      end,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Statistik dokter berhasil diambil',
      data,
    };
  }

  @Get(':id')
  @Roles(UserRole.DOKTER, UserRole.STAF, UserRole.KEPALA_KLINIK)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300)
  @ApiOperation({ summary: 'Detail rekam medis by ID' })
  @ApiParam({ name: 'id', description: 'ID Rekam Medis' })
  @ApiResponse({
    status: 200,
    description: 'Detail rekam medis',
    type: MedicalRecordResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Rekam medis tidak ditemukan' })
  async findOne(
    @Param('id') id: string,
    @GetUser() user: User,
  ): Promise<MedicalRecordResponseDto> {
    return await this.medicalRecordsService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(UserRole.DOKTER, UserRole.STAF, UserRole.KEPALA_KLINIK)
  @ApiOperation({ summary: 'Update rekam medis' })
  @ApiParam({ name: 'id', description: 'ID Rekam Medis' })
  @ApiResponse({
    status: 200,
    description: 'Rekam medis berhasil diupdate',
    type: MedicalRecordResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Rekam medis tidak ditemukan' })
  @ApiResponse({ status: 400, description: 'Data tidak valid' })
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateDto: UpdateMedicalRecordDto,
    @GetUser() user: User,
  ): Promise<MedicalRecordResponseDto> {
    return await this.medicalRecordsService.update(id, updateDto, user);
  }

  @Delete(':id')
  @Roles(UserRole.KEPALA_KLINIK)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Soft delete rekam medis',
    description: 'Hanya KEPALA_KLINIK yang dapat menghapus (soft delete)',
  })
  @ApiParam({ name: 'id', description: 'ID Rekam Medis' })
  @ApiResponse({
    status: 200,
    description: 'Rekam medis berhasil dihapus',
    schema: {
      example: { message: 'Rekam medis berhasil dihapus' },
    },
  })
  @ApiResponse({ status: 404, description: 'Rekam medis tidak ditemukan' })
  async remove(
    @Param('id') id: string,
    @GetUser() user: User,
  ): Promise<MessageResponse> {
    await this.medicalRecordsService.remove(id, user);
    return { message: 'Rekam medis berhasil dihapus' };
  }

  @Post(':id/restore')
  @Roles(UserRole.KEPALA_KLINIK)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Pulihkan rekam medis (restore soft delete)',
    description: 'Hanya KEPALA_KLINIK yang dapat memulihkan',
  })
  @ApiParam({ name: 'id', description: 'ID Rekam Medis' })
  @ApiResponse({
    status: 200,
    description: 'Rekam medis berhasil dipulihkan',
    schema: {
      example: { message: 'Rekam medis berhasil dipulihkan' },
    },
  })
  @ApiResponse({ status: 404, description: 'Rekam medis tidak ditemukan' })
  async restore(
    @Param('id') id: string,
    @GetUser() user: User,
  ): Promise<MessageResponse> {
    await this.medicalRecordsService.restore(id, user);
    return { message: 'Rekam medis berhasil dipulihkan' };
  }

  @Delete(':id/permanent')
  @Roles(UserRole.KEPALA_KLINIK)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Hapus permanen rekam medis (HARD DELETE)',
    description:
      'Hanya KEPALA_KLINIK. PERHATIAN: Aksi ini tidak dapat dibatalkan!',
  })
  @ApiParam({ name: 'id', description: 'ID Rekam Medis' })
  @ApiResponse({
    status: 204,
    description: 'Rekam medis berhasil dihapus permanen',
  })
  @ApiResponse({ status: 404, description: 'Rekam medis tidak ditemukan' })
  async hardDelete(
    @Param('id') id: string,
    @GetUser() user: User,
  ): Promise<void> {
    await this.medicalRecordsService.hardDelete(id, user);
  }
}
