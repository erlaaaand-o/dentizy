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
  Req,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { PaymentsService } from '../../applications/orchestrator/payments.service';
import { CreatePaymentDto } from '../../applications/dto/create-payment.dto';
import { UpdatePaymentDto } from '../../applications/dto/update-payment.dto';
import { QueryPaymentDto } from '../../applications/dto/query-payment.dto';
import { PaymentResponseDto } from '../../applications/dto/payment-response.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/interface/guards/roles.guard';
import { Roles } from '../../../auth/interface/decorators/roles.decorator';
import { UserRole } from '../../../roles/entities/role.entity';
import { GetUser } from '../../../auth/interface/decorators/get-user.decorator';
import { User } from '../../../users/domains/entities/user.entity';
import { ProcessPaymentDto } from '../../../payments/applications/dto/process-payment.dto';

interface StandardResponse<T = unknown> {
  statusCode: number;
  message: string;
  data: T;
}

interface PaginatedResponse<T = unknown> {
  statusCode: number;
  message: string;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface RevenueResponse {
  total: number;
  startDate?: Date;
  endDate?: Date;
}

interface AuthenticatedRequest extends Request {
  user?: User;
}

@ApiTags('Payments')
@ApiBearerAuth('access-token')
@Controller('payments')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
@ApiUnauthorizedResponse({ description: 'Token tidak valid atau kadaluarsa' })
@ApiForbiddenResponse({
  description: 'Role user tidak memiliki akses ke endpoint ini',
})
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Patch(':id/process')
  @Roles(UserRole.STAF, UserRole.KEPALA_KLINIK)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Proses Pembayaran (Kasir)',
    description:
      'Endpoint khusus kasir untuk input pembayaran, hitung kembalian, dan update status lunas.',
  })
  @ApiParam({ name: 'id', description: 'ID Pembayaran', type: Number })
  @ApiOkResponse({
    description: 'Pembayaran berhasil diproses',
    type: PaymentResponseDto,
  })
  async process(
    @Param('id') id: string,
    @Body() dto: ProcessPaymentDto,
    @GetUser() user: User,
  ): Promise<StandardResponse<PaymentResponseDto>> {
    const data = await this.paymentsService.processPayment(id, dto, user.id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Pembayaran berhasil diproses',
      data,
    };
  }

  @Post()
  @Roles(UserRole.KEPALA_KLINIK, UserRole.STAF)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Membuat pembayaran baru',
    description:
      'Endpoint untuk membuat data pembayaran baru. Status pembayaran akan otomatis ditentukan berdasarkan jumlah bayar.',
  })
  @ApiCreatedResponse({
    description: 'Pembayaran berhasil dibuat',
    type: PaymentResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Data tidak valid' })
  @ApiConflictResponse({
    description: 'Pembayaran sudah ada untuk medical record ini',
  })
  async create(
    @Body() createDto: CreatePaymentDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<StandardResponse<PaymentResponseDto>> {
    if (req.user?.id) {
      createDto.createdBy = req.user.id;
    }

    const data = await this.paymentsService.create(createDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Pembayaran berhasil dibuat',
      data,
    };
  }

  @Get()
  @Roles(UserRole.KEPALA_KLINIK, UserRole.STAF)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mendapatkan daftar pembayaran',
    description:
      'Endpoint untuk mendapatkan daftar pembayaran dengan fitur filtering dan pagination',
  })
  @ApiOkResponse({
    description: 'Daftar pembayaran berhasil diambil',
    type: [PaymentResponseDto],
  })
  async findAll(
    @Query() query: QueryPaymentDto,
  ): Promise<PaginatedResponse<PaymentResponseDto>> {
    const result = await this.paymentsService.findAll(query);
    return {
      statusCode: HttpStatus.OK,
      message: 'Data pembayaran berhasil diambil',
      ...result,
    };
  }

  @Get('invoice/:nomorInvoice')
  @Roles(UserRole.KEPALA_KLINIK, UserRole.STAF, UserRole.DOKTER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mendapatkan pembayaran berdasarkan nomor invoice',
    description: 'Endpoint untuk mencari pembayaran menggunakan nomor invoice',
  })
  @ApiParam({
    name: 'nomorInvoice',
    description: 'Nomor invoice pembayaran',
    example: 'INV/20240115/0001',
  })
  @ApiOkResponse({
    description: 'Data pembayaran ditemukan',
    type: PaymentResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Pembayaran tidak ditemukan' })
  async findByNomorInvoice(
    @Param('nomorInvoice') nomorInvoice: string,
  ): Promise<StandardResponse<PaymentResponseDto>> {
    const data = await this.paymentsService.findByNomorInvoice(nomorInvoice);
    return {
      statusCode: HttpStatus.OK,
      message: 'Data pembayaran berhasil diambil',
      data,
    };
  }

  @Get('medical-record/:medicalRecordId')
  @Roles(UserRole.KEPALA_KLINIK, UserRole.STAF, UserRole.DOKTER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mendapatkan pembayaran berdasarkan medical record',
    description:
      'Endpoint untuk mencari pembayaran menggunakan ID medical record',
  })
  @ApiParam({
    name: 'medicalRecordId',
    description: 'ID Medical Record',
    type: Number,
  })
  @ApiOkResponse({
    description: 'Data pembayaran ditemukan',
    type: PaymentResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Pembayaran tidak ditemukan' })
  async findByMedicalRecordId(
    @Param('medicalRecordId') medicalRecordId: string,
  ): Promise<StandardResponse<PaymentResponseDto>> {
    const data =
      await this.paymentsService.findByMedicalRecordId(medicalRecordId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Data pembayaran berhasil diambil',
      data,
    };
  }

  @Get('patient/:patientId')
  @Roles(UserRole.KEPALA_KLINIK, UserRole.STAF, UserRole.DOKTER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mendapatkan riwayat pembayaran pasien',
    description:
      'Endpoint untuk mendapatkan riwayat pembayaran berdasarkan ID pasien',
  })
  @ApiParam({
    name: 'patientId',
    description: 'ID Pasien',
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Jumlah maksimal data',
    type: Number,
  })
  @ApiOkResponse({
    description: 'Riwayat pembayaran pasien',
    type: [PaymentResponseDto],
  })
  async findByPatientId(
    @Param('patientId') patientId: string,
    @Query('limit') limit?: number,
  ): Promise<StandardResponse<PaymentResponseDto[]>> {
    const data = await this.paymentsService.findByPatientId(patientId, limit);
    return {
      statusCode: HttpStatus.OK,
      message: 'Riwayat pembayaran berhasil diambil',
      data,
    };
  }

  @Get('statistics')
  @Roles(UserRole.KEPALA_KLINIK, UserRole.STAF)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mendapatkan statistik pembayaran',
    description:
      'Endpoint untuk mendapatkan statistik pembayaran dalam periode tertentu',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Tanggal mulai (ISO format)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'Tanggal akhir (ISO format)',
  })
  @ApiOkResponse({ description: 'Statistik pembayaran' })
  async getStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<StandardResponse> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    const data = await this.paymentsService.getStatistics(start, end);
    return {
      statusCode: HttpStatus.OK,
      message: 'Statistik pembayaran berhasil dihitung',
      data,
    };
  }

  @Get('revenue')
  @Roles(UserRole.KEPALA_KLINIK, UserRole.STAF)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mendapatkan total pendapatan',
    description:
      'Endpoint untuk menghitung total pendapatan dalam periode tertentu',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Tanggal mulai',
  })
  @ApiQuery({ name: 'endDate', required: false, description: 'Tanggal akhir' })
  @ApiOkResponse({ description: 'Total pendapatan' })
  async getTotalRevenue(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<StandardResponse<RevenueResponse>> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    const total = await this.paymentsService.getTotalRevenue(start, end);
    return {
      statusCode: HttpStatus.OK,
      message: 'Total pendapatan berhasil dihitung',
      data: { total, startDate: start, endDate: end },
    };
  }

  @Get('revenue/period')
  @Roles(UserRole.KEPALA_KLINIK, UserRole.STAF)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mendapatkan pendapatan per periode',
    description:
      'Endpoint untuk mendapatkan breakdown pendapatan per hari/bulan/tahun',
  })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiQuery({
    name: 'groupBy',
    required: false,
    enum: ['day', 'month', 'year'],
  })
  @ApiOkResponse({ description: 'Pendapatan per periode' })
  async getRevenueByPeriod(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('groupBy') groupBy: 'day' | 'month' | 'year' = 'day',
  ): Promise<StandardResponse> {
    const data = await this.paymentsService.getRevenueByPeriod(
      new Date(startDate),
      new Date(endDate),
      groupBy,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Pendapatan per periode berhasil dihitung',
      data,
    };
  }

  @Get(':id')
  @Roles(UserRole.KEPALA_KLINIK, UserRole.STAF, UserRole.DOKTER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mendapatkan detail pembayaran',
    description: 'Endpoint untuk mendapatkan detail pembayaran berdasarkan ID',
  })
  @ApiParam({
    name: 'id',
    description: 'ID Pembayaran',
    type: Number,
  })
  @ApiOkResponse({
    description: 'Detail pembayaran',
    type: PaymentResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Pembayaran tidak ditemukan' })
  async findOne(
    @Param('id') id: string,
  ): Promise<StandardResponse<PaymentResponseDto>> {
    const data = await this.paymentsService.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Data pembayaran berhasil diambil',
      data,
    };
  }

  @Patch(':id')
  @Roles(UserRole.KEPALA_KLINIK, UserRole.STAF)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mengupdate pembayaran',
    description:
      'Endpoint untuk mengupdate data pembayaran. Status akan otomatis dihitung ulang jika jumlah bayar berubah.',
  })
  @ApiParam({ name: 'id', description: 'ID Pembayaran', type: Number })
  @ApiOkResponse({
    description: 'Pembayaran berhasil diupdate',
    type: PaymentResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Pembayaran tidak ditemukan' })
  @ApiBadRequestResponse({
    description: 'Pembayaran yang dibatalkan tidak dapat diubah',
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdatePaymentDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<StandardResponse<PaymentResponseDto>> {
    const updatedBy = req.user?.id;
    const data = await this.paymentsService.update(id, updateDto, updatedBy);
    return {
      statusCode: HttpStatus.OK,
      message: 'Pembayaran berhasil diupdate',
      data,
    };
  }

  @Patch(':id/cancel')
  @Roles(UserRole.KEPALA_KLINIK, UserRole.STAF)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Membatalkan pembayaran',
    description:
      'Endpoint untuk membatalkan pembayaran. Pembayaran yang sudah dibatalkan tidak dapat diubah kembali.',
  })
  @ApiParam({ name: 'id', description: 'ID Pembayaran', type: Number })
  @ApiOkResponse({
    description: 'Pembayaran berhasil dibatalkan',
    type: PaymentResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Pembayaran tidak ditemukan' })
  @ApiBadRequestResponse({ description: 'Pembayaran sudah dibatalkan' })
  async cancel(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<StandardResponse<PaymentResponseDto>> {
    const cancelledBy = req.user?.id;
    const data = await this.paymentsService.cancel(id, cancelledBy);
    return {
      statusCode: HttpStatus.OK,
      message: 'Pembayaran berhasil dibatalkan',
      data,
    };
  }

  @Delete(':id')
  @Roles(UserRole.KEPALA_KLINIK, UserRole.STAF)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Menghapus pembayaran (soft delete)',
    description: 'Endpoint untuk menghapus pembayaran secara soft delete',
  })
  @ApiParam({ name: 'id', description: 'ID Pembayaran', type: Number })
  @ApiOkResponse({ description: 'Pembayaran berhasil dihapus' })
  @ApiNotFoundResponse({ description: 'Pembayaran tidak ditemukan' })
  async remove(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<StandardResponse<Record<string, never>>> {
    const deletedBy = req.user?.id;
    await this.paymentsService.remove(id, deletedBy);
    return {
      statusCode: HttpStatus.OK,
      message: 'Pembayaran berhasil dihapus',
      data: {},
    };
  }
}
