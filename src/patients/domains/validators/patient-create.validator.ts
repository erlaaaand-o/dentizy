import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../entities/patient.entity';
import { CreatePatientDto } from '../../application/dto/create-patient.dto';
import { PatientFieldValidator } from './patient-field.validator';

@Injectable()
export class PatientCreateValidator {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    private readonly fieldValidator: PatientFieldValidator,
  ) {}

  /**
   * Validate create patient data comprehensively
   */
  async validate(dto: CreatePatientDto): Promise<void> {
    // Validate unique fields (NIK, Email)
    await this.validateUniqueFields(dto);

    // Validate field formats
    this.fieldValidator.validateBirthDate(dto.tanggal_lahir);
    this.fieldValidator.validatePhoneNumber(dto.no_hp);
    this.fieldValidator.validateEmail(dto.email);

    // Business rule: Patient must have at least one contact
    this.validateContactInformation(dto);
  }

  /**
   * Validate unique fields (NIK, Email)
   */
  private async validateUniqueFields(dto: CreatePatientDto): Promise<void> {
    if (dto.nik) {
      const existsByNik = await this.patientRepository.findOne({
        where: { nik: dto.nik },
      });
      if (existsByNik) {
        throw new ConflictException(
          `Pasien dengan NIK ${dto.nik} sudah terdaftar`,
        );
      }
    }

    if (dto.email) {
      const existsByEmail = await this.patientRepository.findOne({
        where: { email: dto.email },
      });
      if (existsByEmail) {
        throw new ConflictException(
          `Pasien dengan email ${dto.email} sudah terdaftar`,
        );
      }
    }
  }

  /**
   * Validate contact information requirement
   */
  private validateContactInformation(dto: CreatePatientDto): void {
    if (!dto.no_hp && !dto.email) {
      throw new BadRequestException(
        'Pasien harus memiliki minimal satu kontak (nomor HP atau email)',
      );
    }
  }
}
