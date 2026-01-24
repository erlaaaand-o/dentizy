import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Fingerprint } from '../entities/fingerprint.entity';
import { FingerprintResponseDto } from '../../application/dto/fingerprint-response.dto';

@Injectable()
export class FingerprintMapper {
  toResponseDto(fingerprint: Fingerprint): FingerprintResponseDto {
    const dto = plainToInstance(FingerprintResponseDto, fingerprint, {
      excludeExtraneousValues: true,
    });

    // Add display name
    dto.display_name = this.getDisplayName(fingerprint.finger_position);

    return dto;
  }

  toResponseDtoArray(fingerprints: Fingerprint[]): FingerprintResponseDto[] {
    return fingerprints.map((fp) => this.toResponseDto(fp));
  }

  private getDisplayName(position: string): string {
    const displayNames: Record<string, string> = {
      left_thumb: 'Jempol Kiri',
      left_index: 'Telunjuk Kiri',
      left_middle: 'Jari Tengah Kiri',
      left_ring: 'Jari Manis Kiri',
      left_little: 'Kelingking Kiri',
      right_thumb: 'Jempol Kanan',
      right_index: 'Telunjuk Kanan',
      right_middle: 'Jari Tengah Kanan',
      right_ring: 'Jari Manis Kanan',
      right_little: 'Kelingking Kanan',
    };

    return displayNames[position] || position.replace('_', ' ').toUpperCase();
  }
}
