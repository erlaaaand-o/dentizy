import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { User } from '../../../users/domains/entities/user.entity';
import { Appointment } from '../../domains/entities/appointment.entity';
import { FindAppointmentsQueryDto } from '../dto/find-appointments-query.dto';
import { AppointmentsRepository } from '../../infrastructures/persistence/repositories/appointments.repository';
import { AppointmentQueryBuilder } from '../../infrastructures/persistence/query/appointment-query.builder';

/**
 * Interface untuk search result
 */
interface AppointmentSearchResult {
  data: Appointment[];
  count: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Use Case: Search Appointments
 * Mencari appointments dengan filters dan pagination
 */
@Injectable()
export class AppointmentSearchService {
  private readonly logger = new Logger(AppointmentSearchService.name);

  constructor(
    private readonly repository: AppointmentsRepository,
    private readonly queryBuilder: AppointmentQueryBuilder,
  ) {}

  /**
   * Execute: Search appointments dengan filters
   */
  async execute(
    user: User,
    queryDto: FindAppointmentsQueryDto,
  ): Promise<AppointmentSearchResult> {
    try {
      // 1. BUILD QUERY
      const baseQuery = this.repository.createQueryBuilder('appointment');

      const query = this.queryBuilder.buildFindAllQuery(
        baseQuery,
        user,
        queryDto,
      );

      // 2. EXECUTE QUERY
      const [appointments, total] = await query.getManyAndCount();

      this.logger.log(
        `📋 Retrieved ${appointments.length}/${total} appointments for user #${user.id}`,
      );

      // 3. RETURN PAGINATED RESULT
      const { page = 1, limit = 10 } = queryDto;

      return {
        data: appointments,
        count: total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error(
        '❌ Error fetching appointments:',
        error instanceof Error ? error.stack : String(error),
      );
      throw new BadRequestException('Gagal mengambil daftar janji temu');
    }
  }
}
