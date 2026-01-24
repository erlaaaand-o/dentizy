// backend/src/treatments/applications/dto/paginated-treatment-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { TreatmentResponseDto } from './treatment-response.dto';

class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 10 })
  totalPages: number;
}

export class PaginatedTreatmentResponseDto {
  @ApiProperty({ type: [TreatmentResponseDto] })
  data: TreatmentResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
