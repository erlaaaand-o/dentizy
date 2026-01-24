import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../../domains/entities/patient.entity';
import { PatientResponseDto } from '../dto/patient-response.dto';
import { SearchPatientDto } from '../dto/search-patient.dto';
import { PatientCacheService } from '../../infrastructure/cache/patient-cache.service';
import { PatientMapper } from '../../domains/mappers/patient.mapper';
import { PaginatedPatients } from '../../application/dto/patient-response.dto';

@Injectable()
export class PatientFindService {
  private readonly logger = new Logger(PatientFindService.name);

  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    private readonly cacheService: PatientCacheService,
    private readonly mapper: PatientMapper,
  ) {}

  /**
   * Ambil semua pasien dengan pagination
   */
  async findAll(query: SearchPatientDto): Promise<PaginatedPatients> {
    return this.cacheService.getCachedListOrSearch(query, async () => {
      try {
        const { page = 1, limit = 10 } = query;
        const skip = (page - 1) * limit;

        const [patients, total] = await this.patientRepository.findAndCount({
          where: { is_active: true },
          order: { created_at: 'DESC' },
          select: [
            'id',
            'nomor_rekam_medis',
            'nik',
            'nama_lengkap',
            'tanggal_lahir',
            'jenis_kelamin',
            'email',
            'no_hp',
            'alamat',
            'is_active',
            'created_at',
            'updated_at',
          ],
          take: limit,
          skip: skip,
        });

        this.logger.log(
          `📋 Retrieved ${patients.length}/${total} patients (page ${page})`,
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
        this.logger.error('❌ Error fetching patients:', error);
        throw new BadRequestException('Gagal mengambil daftar pasien');
      }
    });
  }

  /**
   * Find patient by ID
   */
  async findOne(id: string): Promise<PatientResponseDto> {
    return this.cacheService.getCachedPatient(id, async () => {
      try {
        const patient = await this.patientRepository.findOne({
          where: { id },
          relations: ['appointments', 'medical_records'],
        });

        if (!patient) {
          throw new NotFoundException(
            `Pasien dengan ID #${id} tidak ditemukan`,
          );
        }

        return this.mapper.toResponseDto(patient);
      } catch (error) {
        if (error instanceof NotFoundException) throw error;
        this.logger.error(`❌ Error finding patient ID ${id}:`, error);
        throw new BadRequestException('Gagal mengambil data pasien');
      }
    });
  }

  /**
   * Find patient by medical record number
   */
  async findByMedicalRecordNumber(
    nomorRekamMedis: string,
  ): Promise<PatientResponseDto> {
    const patient = await this.findByField(
      'nomor_rekam_medis',
      nomorRekamMedis,
      'nomor rekam medis',
    );
    return this.mapper.toResponseDto(patient);
  }

  /**
   * Find patient by NIK
   */
  async findByNik(nik: string): Promise<PatientResponseDto> {
    const patient = await this.findByField('nik', nik, 'NIK');
    return this.mapper.toResponseDto(patient);
  }

  /**
   * Find patients by doctor
   */
  async findByDoctor(
    doctorId: string,
    query: SearchPatientDto,
  ): Promise<PaginatedPatients> {
    try {
      const { page = 1, limit = 10, search } = query;
      const skip = (page - 1) * limit;

      const qb = this.patientRepository
        .createQueryBuilder('patient')
        .leftJoin('patient.appointments', 'appointment')
        .where('appointment.doctor_id = :doctorId', { doctorId })
        .andWhere('patient.is_active = :is_active', { is_active: true });

      if (search) {
        qb.andWhere(
          '(patient.nama_lengkap LIKE :search OR patient.nik LIKE :search OR patient.nomor_rekam_medis LIKE :search OR patient.email LIKE :search)',
          { search: `%${search}%` },
        );
      }

      qb.distinct(true)
        .orderBy('patient.created_at', 'DESC')
        .skip(skip)
        .take(limit);

      const [patients, total] = await qb.getManyAndCount();

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
      this.logger.error('❌ Error in findByDoctor:', error);
      throw new BadRequestException(
        'Gagal mengambil daftar pasien untuk dokter',
      );
    }
  }

  /**
   * Helper method untuk find by field
   */
  private async findByField(
    field: string,
    value: string,
    fieldLabel: string,
  ): Promise<Patient> {
    try {
      const patient = await this.patientRepository.findOne({
        where: { [field]: value } as Record<string, unknown>,
        relations: ['appointments', 'medical_records'],
      });

      if (!patient) {
        throw new NotFoundException(
          `Pasien dengan ${fieldLabel} ${value} tidak ditemukan`,
        );
      }

      return patient;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`❌ Error finding patient by ${fieldLabel}:`, error);
      throw new BadRequestException('Gagal mencari pasien');
    }
  }
}
