// backend/src/payments/applications/dto/update-payment.dto.ts
import { PartialType, OmitType } from '@nestjs/swagger';
import { CreatePaymentDto } from './create-payment.dto';

export class UpdatePaymentDto extends PartialType(
  OmitType(CreatePaymentDto, [
    'medicalRecordId',
    'patientId',
    'createdBy', // [SARAN] Creator ID tidak boleh diganti manual
  ] as const),
) {}
