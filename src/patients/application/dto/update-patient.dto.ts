import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';

import { CreatePatientDto } from './create-patient.dto';

export class UpdatePatientDto extends PartialType(CreatePatientDto) {
  @ApiPropertyOptional({
    description: 'Status aktif pasien',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'Status aktif harus berupa boolean' })
  is_active?: boolean;
}
