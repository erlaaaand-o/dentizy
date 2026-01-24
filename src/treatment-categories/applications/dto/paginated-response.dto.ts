// backend/src/treatment-categories/applications/dto/paginated-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({ example: 1, description: 'Current page number' })
  page: number;

  @ApiProperty({ example: 10, description: 'Items per page' })
  limit: number;

  @ApiProperty({ example: 100, description: 'Total items' })
  total: number;

  @ApiProperty({ example: 10, description: 'Total pages' })
  totalPages: number;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ type: 'array', description: 'Array of data items' })
  data: T[];

  @ApiProperty({ type: PaginationMetaDto, description: 'Pagination metadata' })
  meta: PaginationMetaDto;
}
