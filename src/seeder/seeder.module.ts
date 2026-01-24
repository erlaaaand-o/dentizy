import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeederService } from './seeder.service';
import { Role } from '../roles/entities/role.entity';
import { User } from '../users/domains/entities/user.entity';
import { Patient } from '../patients/domains/entities/patient.entity';
import { Appointment } from '../appointments/domains/entities/appointment.entity';
import { MedicalRecord } from 'src/medical_records/domains/entities/medical-record.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role, User, Patient, Appointment, MedicalRecord]),
  ],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}
