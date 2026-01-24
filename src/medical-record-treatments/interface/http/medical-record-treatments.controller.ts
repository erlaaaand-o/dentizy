// backend/src/medical-record-treatments/interface/http/medical-record-treatments.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ClassSerializerInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { MedicalRecordTreatmentsService } from '../../applications/orchestrator/medical-record-treatments.service';
import { CreateMedicalRecordTreatmentDto } from '../../applications/dto/create-medical-record-treatment.dto';
import { UpdateMedicalRecordTreatmentDto } from '../../applications/dto/update-medical-record-treatment.dto';
import { QueryMedicalRecordTreatmentDto } from '../../applications/dto/query-medical-record-treatment.dto';
import { MedicalRecordTreatmentResponseDto } from '../../applications/dto/medical-record-treatment-response.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../../auth/interface/guards/roles.guard';
import { Roles } from '../../../auth/interface/decorators/roles.decorator';
import { UserRole } from '../../../roles/entities/role.entity';

@ApiTags('Medical Record Treatments')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
@ApiUnauthorizedResponse({ description: 'Token tidak valid atau kadaluarsa' })
@ApiForbiddenResponse({
  description: 'Role user tidak memiliki akses ke endpoint ini',
})
@Controller('medical-record-treatments')
export class MedicalRecordTreatmentsController {
  constructor(
    private readonly medicalRecordTreatmentsService: MedicalRecordTreatmentsService,
  ) {}

  @Post()
  @Roles(UserRole.KEPALA_KLINIK, UserRole.DOKTER) // Hanya Dokter/Admin yang boleh input tindakan medis
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tambah perawatan ke rekam medis' })
  @ApiResponse({
    status: 201,
    description: 'Perawatan berhasil ditambahkan',
    type: MedicalRecordTreatmentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Treatment not found' })
  async create(@Body() createDto: CreateMedicalRecordTreatmentDto) {
    const data = await this.medicalRecordTreatmentsService.create(createDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Perawatan berhasil ditambahkan ke rekam medis',
      data,
    };
  }

  @Get()
  @Roles(UserRole.KEPALA_KLINIK, UserRole.DOKTER, UserRole.STAF) // Staf perlu lihat data untuk billing
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ambil semua data perawatan rekam medis' })
  @ApiResponse({
    status: 200,
    description: 'Data berhasil diambil',
    type: [MedicalRecordTreatmentResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Query() query: QueryMedicalRecordTreatmentDto) {
    const result = await this.medicalRecordTreatmentsService.findAll(query);
    return {
      statusCode: HttpStatus.OK,
      message: 'Data perawatan rekam medis berhasil diambil',
      ...result,
    };
  }

  @Get('stats/top-treatments')
  @Roles(UserRole.KEPALA_KLINIK, UserRole.STAF)
  @ApiOperation({ summary: 'Statistik layanan terlaris' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTopTreatments(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit: number = 10,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const data = await this.medicalRecordTreatmentsService.getTopTreatments(
      limit,
      start,
      end,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Statistik layanan berhasil diambil',
      data,
    };
  }

  @Get('medical-record/:medicalRecordId')
  @Roles(UserRole.KEPALA_KLINIK, UserRole.DOKTER, UserRole.STAF) // Staf perlu lihat detail per kunjungan
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ambil semua perawatan berdasarkan Medical Record ID',
  })
  @ApiParam({
    name: 'medicalRecordId',
    type: Number,
    description: 'ID Rekam Medis',
  })
  @ApiResponse({
    status: 200,
    description: 'Data berhasil diambil',
    type: [MedicalRecordTreatmentResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findByMedicalRecordId(
    @Param('medicalRecordId') medicalRecordId: string,
  ) {
    const data =
      await this.medicalRecordTreatmentsService.findByMedicalRecordId(
        medicalRecordId,
      );
    return {
      statusCode: HttpStatus.OK,
      message: 'Data perawatan rekam medis berhasil diambil',
      data,
    };
  }

  @Get('medical-record/:medicalRecordId/total')
  @Roles(UserRole.KEPALA_KLINIK, UserRole.DOKTER, UserRole.STAF) // Penting untuk Staf menghitung tagihan
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Hitung total biaya perawatan berdasarkan Medical Record ID',
  })
  @ApiParam({
    name: 'medicalRecordId',
    type: Number,
    description: 'ID Rekam Medis',
  })
  @ApiResponse({
    status: 200,
    description: 'Total biaya berhasil dihitung',
    schema: {
      properties: {
        statusCode: { type: 'number', example: 200 },
        message: {
          type: 'string',
          example: 'Total biaya perawatan berhasil dihitung',
        },
        data: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 500000 },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTotalByMedicalRecordId(
    @Param('medicalRecordId') medicalRecordId: string,
  ) {
    const total =
      await this.medicalRecordTreatmentsService.getTotalByMedicalRecordId(
        medicalRecordId,
      );
    return {
      statusCode: HttpStatus.OK,
      message: 'Total biaya perawatan berhasil dihitung',
      data: { total },
    };
  }

  @Get(':id')
  @Roles(UserRole.KEPALA_KLINIK, UserRole.DOKTER, UserRole.STAF)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ambil detail perawatan rekam medis berdasarkan ID',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID Medical Record Treatment',
  })
  @ApiResponse({
    status: 200,
    description: 'Data berhasil diambil',
    type: MedicalRecordTreatmentResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Data not found' })
  async findOne(@Param('id') id: string) {
    const data = await this.medicalRecordTreatmentsService.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Data perawatan rekam medis berhasil diambil',
      data,
    };
  }

  @Patch(':id')
  @Roles(UserRole.KEPALA_KLINIK, UserRole.DOKTER) // Staf tidak boleh edit data medis
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update perawatan rekam medis' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID Medical Record Treatment',
  })
  @ApiResponse({
    status: 200,
    description: 'Data berhasil diupdate',
    type: MedicalRecordTreatmentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Data not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateMedicalRecordTreatmentDto,
  ) {
    const data = await this.medicalRecordTreatmentsService.update(
      id,
      updateDto,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Perawatan rekam medis berhasil diupdate',
      data,
    };
  }

  @Delete(':id')
  @Roles(UserRole.KEPALA_KLINIK, UserRole.DOKTER) // Staf tidak boleh hapus data medis
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hapus perawatan rekam medis (soft delete)' })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID Medical Record Treatment',
  })
  @ApiResponse({
    status: 200,
    description: 'Data berhasil dihapus',
    schema: {
      properties: {
        statusCode: { type: 'number', example: 200 },
        message: {
          type: 'string',
          example: 'Perawatan rekam medis berhasil dihapus',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Data not found' })
  async remove(@Param('id') id: string) {
    await this.medicalRecordTreatmentsService.remove(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Perawatan rekam medis berhasil dihapus',
    };
  }
}
