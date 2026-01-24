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
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../../auth/interface/guards/roles.guard';
import { Roles } from '../../../auth/interface/decorators/roles.decorator';
import { UserRole } from '../../../roles/entities/role.entity';
import { PatientsService } from '../../application/orchestrator/patients.service';
import { CreatePatientDto } from '../../application/dto/create-patient.dto';
import { UpdatePatientDto } from '../../application/dto/update-patient.dto';
import { SearchPatientDto } from '../../application/dto/search-patient.dto';
import { PatientResponseDto } from '../../application/dto/patient-response.dto';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { ThrottlerGuard } from '@nestjs/throttler';

@ApiTags('Patients')
@ApiBearerAuth('access-token')
@Controller('patients')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
@ApiUnauthorizedResponse({ description: 'Token tidak valid atau kadaluarsa' })
@ApiForbiddenResponse({
  description: 'Role user tidak memiliki akses ke endpoint ini',
})
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @Roles(UserRole.STAF, UserRole.KEPALA_KLINIK)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Buat pasien baru',
    description: 'Hanya STAF dan KEPALA_KLINIK yang dapat membuat pasien baru',
  })
  @ApiResponse({
    status: 201,
    description: 'Pasien berhasil dibuat',
    type: PatientResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Data tidak valid' })
  @ApiResponse({ status: 409, description: 'NIK atau email sudah terdaftar' })
  async create(
    @Body() createPatientDto: CreatePatientDto,
  ): Promise<PatientResponseDto> {
    return this.patientsService.create(createPatientDto);
  }

  @Get()
  @Roles(UserRole.STAF, UserRole.DOKTER, UserRole.KEPALA_KLINIK)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60) // Cache 60 seconds
  @ApiOperation({ summary: 'Daftar semua pasien dengan pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Daftar pasien berhasil diambil',
    type: [PatientResponseDto],
  })
  async findAll(@Query() query: SearchPatientDto) {
    return this.patientsService.findAll(query);
  }

  @Get('search')
  @Roles(UserRole.STAF, UserRole.DOKTER, UserRole.KEPALA_KLINIK)
  @UseGuards(ThrottlerGuard) // Rate limiting untuk search
  @ApiOperation({
    summary: 'Real-time search pasien',
    description:
      'Pencarian dengan multi-field: nama, NIK, nomor rekam medis, email, no HP',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Kata kunci pencarian',
  })
  @ApiQuery({ name: 'jenis_kelamin', required: false, enum: ['L', 'P'] })
  @ApiQuery({ name: 'umur_min', required: false, type: Number })
  @ApiQuery({ name: 'umur_max', required: false, type: Number })
  @ApiQuery({ name: 'is_active', required: false, type: Boolean })
  @ApiQuery({ name: 'has_allergies', required: false, type: Boolean })
  @ApiResponse({
    status: 200,
    description: 'Hasil pencarian',
    type: [PatientResponseDto],
  })
  async search(@Query() query: SearchPatientDto) {
    return this.patientsService.search(query);
  }

  @Get('statistics')
  @Roles(UserRole.KEPALA_KLINIK, UserRole.DOKTER)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300) // Cache 5 minutes
  @ApiOperation({ summary: 'Statistik pasien untuk dashboard' })
  @ApiResponse({
    status: 200,
    description: 'Statistik pasien',
    schema: {
      example: {
        total: 150,
        new_this_month: 12,
        active: 145,
        with_allergies: 23,
      },
    },
  })
  async getStatistics() {
    return this.patientsService.getStatistics();
  }

  @Get('by-medical-record/:number')
  @Roles(UserRole.STAF, UserRole.DOKTER, UserRole.KEPALA_KLINIK)
  @ApiOperation({ summary: 'Cari pasien by nomor rekam medis' })
  @ApiParam({
    name: 'number',
    description: 'Nomor rekam medis (format: YYYYMMDD-XXX)',
  })
  @ApiResponse({ status: 200, type: PatientResponseDto })
  @ApiResponse({ status: 404, description: 'Pasien tidak ditemukan' })
  async findByMedicalRecordNumber(
    @Param('number') number: string,
  ): Promise<PatientResponseDto> {
    return this.patientsService.findByMedicalRecordNumber(number);
  }

  @Get('by-nik/:nik')
  @Roles(UserRole.STAF, UserRole.DOKTER, UserRole.KEPALA_KLINIK)
  @ApiOperation({ summary: 'Cari pasien by NIK' })
  @ApiParam({ name: 'nik', description: 'NIK 16 digit' })
  @ApiResponse({ status: 200, type: PatientResponseDto })
  @ApiResponse({ status: 404, description: 'Pasien tidak ditemukan' })
  async findByNik(@Param('nik') nik: string): Promise<PatientResponseDto> {
    return this.patientsService.findByNik(nik);
  }

  @Get('by-doctor/:doctorId')
  @Roles(UserRole.STAF, UserRole.DOKTER, UserRole.KEPALA_KLINIK)
  @ApiOperation({ summary: 'Daftar pasien per dokter gigi' })
  @ApiParam({ name: 'doctorId', description: 'ID Dokter Gigi' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Daftar pasien dokter',
    type: [PatientResponseDto],
  })
  async findByDoctor(
    @Param('doctorId') doctorId: string,
    @Query() query: SearchPatientDto,
  ) {
    return this.patientsService.findByDoctor(doctorId, query);
  }

  @Get(':id')
  @Roles(UserRole.STAF, UserRole.DOKTER, UserRole.KEPALA_KLINIK)
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300)
  @ApiOperation({ summary: 'Detail pasien by ID' })
  @ApiParam({ name: 'id', description: 'ID Pasien' })
  @ApiResponse({
    status: 200,
    description: 'Detail pasien dengan relasi',
    type: PatientResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Pasien tidak ditemukan' })
  async findOne(@Param('id') id: string): Promise<PatientResponseDto> {
    return this.patientsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.STAF, UserRole.KEPALA_KLINIK)
  @ApiOperation({
    summary: 'Update data pasien',
    description: 'Hanya STAF dan KEPALA_KLINIK yang dapat update',
  })
  @ApiParam({ name: 'id', description: 'ID Pasien' })
  @ApiResponse({
    status: 200,
    description: 'Pasien berhasil diupdate',
    type: PatientResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Pasien tidak ditemukan' })
  @ApiResponse({ status: 409, description: 'NIK atau email sudah digunakan' })
  async update(
    @Param('id') id: string,
    @Body() updatePatientDto: UpdatePatientDto,
  ): Promise<PatientResponseDto> {
    return this.patientsService.update(id, updatePatientDto);
  }

  @Delete(':id')
  @Roles(UserRole.KEPALA_KLINIK)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Soft delete pasien',
    description:
      'Hanya KEPALA_KLINIK yang dapat menghapus pasien (soft delete)',
  })
  @ApiParam({ name: 'id', description: 'ID Pasien' })
  @ApiResponse({
    status: 200,
    description: 'Pasien berhasil dihapus',
    schema: {
      example: { message: 'Pasien John Doe berhasil dihapus' },
    },
  })
  @ApiResponse({ status: 404, description: 'Pasien tidak ditemukan' })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.patientsService.remove(id);
  }

  @Patch(':id/activate')
  @Roles(UserRole.STAF, UserRole.KEPALA_KLINIK)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verifikasi & Aktifkan Pasien (dari Pendaftaran Online)',
    description:
      'Digunakan saat pasien datang ke klinik untuk memverifikasi data dan mengaktifkan statusnya.',
  })
  @ApiResponse({
    status: 200,
    description: 'Pasien berhasil diaktifkan',
    type: PatientResponseDto,
  })
  async activatePatient(@Param('id') id: string): Promise<PatientResponseDto> {
    return this.patientsService.update(id, { is_active: true });
  }

  @Patch(':id/restore')
  @Roles(UserRole.KEPALA_KLINIK)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Pulihkan pasien (restore soft delete)',
    description:
      'Hanya KEPALA_KLINIK yang dapat memulihkan pasien yang telah dihapus (soft delete)',
  })
  @ApiParam({ name: 'id', description: 'ID Pasien' })
  @ApiResponse({
    status: 200,
    description: 'Pasien berhasil dipulihkan',
    schema: {
      example: { message: 'Pasien John Doe berhasil dipulihkan' },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Pasien tidak ditemukan atau tidak dihapus',
  })
  async restore(@Param('id') id: string): Promise<{ message: string }> {
    return this.patientsService.restore(id);
  }
}
