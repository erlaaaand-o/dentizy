// backend/src/treatment-categories/interface/http/treatment-categories.controller.ts
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
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { TreatmentCategoriesService } from '../../applications/orchestrator/treatment-categories.service';
import { CreateTreatmentCategoryDto } from '../../applications/dto/create-treatment-category.dto';
import { UpdateTreatmentCategoryDto } from '../../applications/dto/update-treatment-category.dto';
import { QueryTreatmentCategoryDto } from '../../applications/dto/query-treatment-category.dto';
import { TreatmentCategoryResponseDto } from '../../applications/dto/treatment-category-response.dto';
import { RolesGuard } from '../../../auth/interface/guards/roles.guard';
import { Roles } from '../../../auth/interface/decorators/roles.decorator';
import { UserRole } from '../../../roles/entities/role.entity';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Treatment Categories')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
@ApiUnauthorizedResponse({ description: 'Token tidak valid atau kadaluarsa' })
@ApiForbiddenResponse({
  description: 'Role user tidak memiliki akses ke endpoint ini',
})
@Controller('treatment-categories')
export class TreatmentCategoriesController {
  constructor(
    private readonly treatmentCategoriesService: TreatmentCategoriesService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.KEPALA_KLINIK) // Hanya admin yang boleh membuat master data
  @ApiOperation({ summary: 'Create new treatment category' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Category created successfully',
    type: TreatmentCategoryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Category name already exists',
  })
  async create(@Body() createDto: CreateTreatmentCategoryDto) {
    const data = await this.treatmentCategoriesService.create(createDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Kategori perawatan berhasil dibuat',
      data,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.KEPALA_KLINIK, UserRole.DOKTER, UserRole.STAF) // Semua role perlu melihat daftar kategori
  @ApiOperation({ summary: 'Get all treatment categories with pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Categories retrieved successfully',
  })
  async findAll(@Query() query: QueryTreatmentCategoryDto) {
    const result = await this.treatmentCategoriesService.findAll(query);
    return {
      statusCode: HttpStatus.OK,
      message: 'Data kategori perawatan berhasil diambil',
      ...result,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.KEPALA_KLINIK, UserRole.DOKTER, UserRole.STAF)
  @ApiOperation({ summary: 'Get treatment category by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Category ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category found',
    type: TreatmentCategoryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Category not found',
  })
  async findOne(@Param('id') id: string) {
    const data = await this.treatmentCategoriesService.findOne(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Data kategori perawatan berhasil diambil',
      data,
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.KEPALA_KLINIK) // Hanya admin yang boleh edit master data
  @ApiOperation({ summary: 'Update treatment category' })
  @ApiParam({ name: 'id', type: Number, description: 'Category ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category updated successfully',
    type: TreatmentCategoryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Category not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Category name already exists',
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateTreatmentCategoryDto,
  ) {
    const data = await this.treatmentCategoriesService.update(id, updateDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Kategori perawatan berhasil diupdate',
      data,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.KEPALA_KLINIK) // Hanya admin yang boleh hapus
  @ApiOperation({ summary: 'Soft delete treatment category' })
  @ApiParam({ name: 'id', type: Number, description: 'Category ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Category not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete category with active treatments',
  })
  async remove(@Param('id') id: string) {
    await this.treatmentCategoriesService.remove(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Kategori perawatan berhasil dihapus',
    };
  }

  @Patch(':id/restore')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.KEPALA_KLINIK) // Hanya admin yang boleh restore
  @ApiOperation({ summary: 'Restore soft deleted category' })
  @ApiParam({ name: 'id', type: Number, description: 'Category ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category restored successfully',
    type: TreatmentCategoryResponseDto,
  })
  async restore(@Param('id') id: string) {
    const data = await this.treatmentCategoriesService.restore(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Kategori perawatan berhasil dipulihkan',
      data,
    };
  }
}
