// applications/use-cases/medical-record-find.service.ts
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { MedicalRecord } from '../../domains/entities/medical-record.entity';
import { User } from '../../../users/domains/entities/user.entity';
import { MedicalRecordAuthorizationService } from '../../domains/services/medical-record-authorization.service';
import { MedicalRecordValidator } from '../../domains/validators/medical-record.validator';
import { AppointmentStatus } from '../../../appointments/domains/entities/appointment.entity';

@Injectable()
export class MedicalRecordFindService {
  private readonly logger = new Logger(MedicalRecordFindService.name);

  constructor(
    @InjectRepository(MedicalRecord)
    private readonly repository: Repository<MedicalRecord>,
    private readonly authService: MedicalRecordAuthorizationService,
    private readonly validator: MedicalRecordValidator,
  ) {}

  /**
   * Find medical record by ID with authorization check
   */
  async execute(id: string, user: User): Promise<MedicalRecord> {
    // Validate input
    this.validator.validateId(id);
    this.validator.validateUserId(user.id);

    // Build query with authorization filter
    const queryBuilder = this.repository
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.appointment', 'appointment')
      .leftJoinAndSelect('appointment.patient', 'patient')
      .leftJoinAndSelect('appointment.doctor', 'appointmentDoctor')
      .leftJoinAndSelect('appointmentDoctor.roles', 'doctorRoles')
      .leftJoinAndSelect('record.doctor', 'doctor')
      .where('record.id = :id', { id });

    // Apply role-based filtering
    this.applyAuthorizationFilter(queryBuilder, user);

    // Execute query
    const record = await queryBuilder.getOne();

    if (!record) {
      throw new NotFoundException(
        `Rekam medis dengan ID #${id} tidak ditemukan atau Anda tidak memiliki akses`,
      );
    }

    if (!record.appointment) {
      throw new BadRequestException(
        `Appointment untuk rekam medis #${id} tidak ditemukan`,
      );
    }

    // Double-check authorization at domain level
    this.authService.validateViewPermission(user, record);

    // Log access
    this.logger.log(
      `User ${user.id} (${this.authService.getRoleSummary(user)}) ` +
        `accessed medical record #${id}`,
    );

    return record;
  }

  /**
   * Apply authorization filter based on user role
   */
  private applyAuthorizationFilter(
    queryBuilder: SelectQueryBuilder<MedicalRecord>,
    user: User,
  ): void {
    const isKepalaKlinik = this.authService.isKepalaKlinik(user);
    const isDokter = this.authService.isDokter(user);
    const isStaf = this.authService.isStaf(user);

    if (!isKepalaKlinik) {
      if (isDokter) {
        // Doctor can see records they created OR from their appointments
        queryBuilder.andWhere(
          '(appointment.doctor_id = :userId OR record.doctor_id = :userId)',
          { userId: user.id },
        );
      } else if (isStaf) {
        // Staff can see records they created OR any active records
        queryBuilder.andWhere(
          '(record.doctor_id = :userId OR appointment.status != :cancelled)',
          {
            userId: user.id,
            cancelled: AppointmentStatus.DIBATALKAN,
          },
        );
      } else {
        // Unknown role - deny access by impossible condition
        queryBuilder.andWhere('1 = 0');
      }
    }
    // Kepala Klinik has no filter (can see all)
  }
}
