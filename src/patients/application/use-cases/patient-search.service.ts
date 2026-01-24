import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../../domains/entities/patient.entity';
import { SearchPatientDto } from '../dto/search-patient.dto';
import { PatientQueryBuilder } from '../../infrastructure/persistence/query/patient-query.builder';
import { PatientValidator } from '../../domains/validators/patient.validator';
import { PatientCacheService } from '../../infrastructure/cache/patient-cache.service';
import { PatientMapper } from '../../domains/mappers/patient.mapper';
import { PaginatedPatients } from '../../application/dto/patient-response.dto';

@Injectable()
export class PatientSearchService {
  private readonly logger = new Logger(PatientSearchService.name);

  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    private readonly queryBuilder: PatientQueryBuilder,
    private readonly validator: PatientValidator,
    private readonly cacheService: PatientCacheService,
    private readonly mapper: PatientMapper,
  ) {}

  /**
   * Search pasien dengan full features
   */
  async execute(query: SearchPatientDto): Promise<PaginatedPatients> {
    return this.cacheService.getCachedListOrSearch(query, async () => {
      try {
        this.validator.validateSearchQuery(query);

        const { page = 1, limit = 10 } = query;
        const skip = (page - 1) * limit;

        // Build query dengan filter dan sorting
        const queryBuilderInstance = this.queryBuilder.build(
          this.patientRepository.createQueryBuilder('patient'),
          query,
        );

        // Apply pagination
        queryBuilderInstance.take(limit).skip(skip);

        const [patients, total] = await queryBuilderInstance.getManyAndCount();

        this.logger.log(
          `🔍 Search: "${query.search || 'all'}" | Results: ${patients.length}/${total}`,
        );

        return {
          data: this.mapper.toResponseDtoList(patients),
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        };
      } catch (error) {
        if (error instanceof BadRequestException) throw error;
        this.logger.error('❌ Error searching patients:', error.stack);
        throw new BadRequestException(
          'Gagal mencari pasien. Silakan coba lagi.',
        );
      }
    });
  }
}
