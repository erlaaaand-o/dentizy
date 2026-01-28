import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiProperty,
} from '@nestjs/swagger';

import { Roles } from '../../../auth/interface/decorators/roles.decorator';
import { RolesGuard } from '../../../auth/interface/guards/roles.guard';
import { UserRole } from '../../../roles/entities/role.entity';
import { CreateFingerprintDto } from '../../application/dto/create-fingerprint.dto';
import {
  FingerprintResponseDto,
  VerifyFingerprintResponseDto,
} from '../../application/dto/fingerprint-response.dto';
import { VerifyFingerprintDto } from '../../application/dto/verify-fingerprint.dto';
import { FingerprintsService } from '../../application/orchestrator/fingerprints.service';

// --- DTO Helper (Local) untuk Strict Typing ---

export class DeleteResponseDto {
  @ApiProperty()
  message: string;
}

export class DeviceStatusDto {
  @ApiProperty()
  isConnected: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty({ required: false })
  details?: Record<string, unknown>;
}

// --- Controller ---

@ApiTags('Fingerprints')
@ApiBearerAuth('access-token')
@Controller('fingerprints')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class FingerprintsController {
  constructor(private readonly fingerprintsService: FingerprintsService) {}

  @Post('enroll')
  @Roles(UserRole.STAF, UserRole.KEPALA_KLINIK)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Daftarkan sidik jari pasien',
    description: 'Mendaftarkan sidik jari baru untuk pasien',
  })
  @ApiResponse({
    status: 201,
    description: 'Sidik jari berhasil didaftarkan',
    type: FingerprintResponseDto,
  })
  async enroll(
    @Body() dto: CreateFingerprintDto,
  ): Promise<FingerprintResponseDto> {
    return this.fingerprintsService.enroll(dto);
  }

  @Post('verify')
  @Roles(UserRole.STAF, UserRole.DOKTER, UserRole.KEPALA_KLINIK)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verifikasi sidik jari',
    description:
      'Verifikasi identitas pasien menggunakan sidik jari (1:1 atau 1:N)',
  })
  @ApiResponse({
    status: 200,
    description: 'Hasil verifikasi',
    type: VerifyFingerprintResponseDto,
  })
  async verify(
    @Body() dto: VerifyFingerprintDto,
  ): Promise<VerifyFingerprintResponseDto> {
    return this.fingerprintsService.verify(dto);
  }

  @Get('patient/:patientId')
  @Roles(UserRole.STAF, UserRole.DOKTER, UserRole.KEPALA_KLINIK)
  @ApiOperation({ summary: 'Daftar sidik jari pasien' })
  @ApiResponse({
    status: 200,
    description: 'Daftar sidik jari',
    type: [FingerprintResponseDto],
  })
  async findByPatient(
    @Param('patientId') patientId: string,
  ): Promise<FingerprintResponseDto[]> {
    return this.fingerprintsService.findByPatient(patientId);
  }

  @Delete(':id')
  @Roles(UserRole.STAF, UserRole.KEPALA_KLINIK)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hapus sidik jari' })
  @ApiResponse({
    status: 200,
    description: 'Sidik jari berhasil dihapus',
    type: DeleteResponseDto, // Tipe jelas untuk Swagger
  })
  async remove(@Param('id') id: string): Promise<DeleteResponseDto> {
    return this.fingerprintsService.remove(id);
  }

  @Get('device/status')
  @Roles(UserRole.STAF, UserRole.KEPALA_KLINIK)
  @ApiOperation({ summary: 'Status perangkat sidik jari' })
  @ApiResponse({
    status: 200,
    description: 'Informasi perangkat',
    type: DeviceStatusDto, // Tipe jelas, pengganti any
  })
  async getDeviceStatus(): Promise<DeviceStatusDto> {
    return this.fingerprintsService.getDeviceStatus();
  }
}
