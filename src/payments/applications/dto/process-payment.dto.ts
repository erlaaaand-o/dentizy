import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  Min,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MetodePembayaran } from '../../../payments/domains/entities/payments.entity';

export class ProcessPaymentDto {
  @ApiProperty({
    description: 'Jumlah uang yang diserahkan pasien',
    example: 100000,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  jumlah_bayar: number;

  @ApiProperty({
    description: 'Metode pembayaran',
    example: 'tunai',
    enum: ['tunai', 'transfer', 'kartu_kredit', 'kartu_debit', 'qris'],
  })
  @IsOptional()
  @IsString()
  @IsEnum(['tunai', 'transfer', 'kartu_kredit', 'kartu_debit', 'qris'])
  metode_pembayaran?: MetodePembayaran;

  @ApiProperty({ description: 'Catatan tambahan', required: false })
  @IsOptional()
  @IsString()
  keterangan?: string;
}
