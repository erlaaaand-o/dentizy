import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../entities/patient.entity';
import { UpdatePatientDto } from '../../application/dto/update-patient.dto';
import { PatientFieldValidator } from './patient-field.validator';

@Injectable()
export class PatientUpdateValidator {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    private readonly fieldValidator: PatientFieldValidator,
  ) {}

  /**
   * Validate update patient data
   */
  async validate(id: string, dto: UpdatePatientDto): Promise<void> {
    const patient = await this.patientRepository.findOneBy({ id });

    if (!patient) {
      throw new BadRequestException(`Pasien dengan ID #${id} tidak ditemukan`);
    }

    // Validate NIK uniqueness if changed
    if (dto.nik && dto.nik !== patient.nik) {
      await this.validateNikUniqueness(id, dto.nik);
    }

    // Validate email uniqueness if changed
    if (dto.email && dto.email !== patient.email) {
      await this.validateEmailUniqueness(id, dto.email);
    }

    // Validate field formats
    this.fieldValidator.validateBirthDate(dto.tanggal_lahir);
    this.fieldValidator.validatePhoneNumber(dto.no_hp);
    this.fieldValidator.validateEmail(dto.email);

    // Business rule: Don't remove all contacts
    this.validateContactUpdate(patient, dto);
  }

  /**
   * Validate NIK uniqueness for update
   */
  private async validateNikUniqueness(id: string, nik: string): Promise<void> {
    const existing = await this.patientRepository.findOne({
      where: { nik },
    });

    if (existing && existing.id !== id) {
      throw new ConflictException(`NIK ${nik} sudah terdaftar`);
    }
  }

  /**
   * Validate email uniqueness for update
   */
  private async validateEmailUniqueness(
    id: string,
    email: string,
  ): Promise<void> {
    const existing = await this.patientRepository.findOne({
      where: { email },
    });

    if (existing && existing.id !== id) {
      throw new ConflictException(`Email ${email} sudah terdaftar`);
    }
  }

  /**
   * Validate that patient keeps at least one contact method
   */
  private validateContactUpdate(patient: Patient, dto: UpdatePatientDto): void {
    const newNoHp = dto.no_hp !== undefined ? dto.no_hp : patient.no_hp;
    const newEmail = dto.email !== undefined ? dto.email : patient.email;

    if (!newNoHp && !newEmail) {
      throw new BadRequestException(
        'Pasien harus memiliki minimal satu kontak (nomor HP atau email)',
      );
    }
  }
}
