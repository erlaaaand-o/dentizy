// patient.mapper.service.ts

import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Patient } from '../entities/patient.entity';
import { PatientResponseDto } from '../../application/dto/patient-response.dto';

@Injectable()
export class PatientMapper {
  /**
   * Mengubah satu entitas Patient menjadi PatientResponseDto.
   */
  public toResponseDto(patient: Patient): PatientResponseDto {
    return plainToInstance(PatientResponseDto, patient, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Mengubah array entitas Patient menjadi array PatientResponseDto.
   */
  public toResponseDtoList(patients: Patient[]): PatientResponseDto[] {
    return patients.map((patient) => this.toResponseDto(patient));
  }
}
