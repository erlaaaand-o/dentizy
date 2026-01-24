import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateFingerprintDto } from '../../application/dto/create-fingerprint.dto';
import { VerifyFingerprintDto } from '../../application/dto/verify-fingerprint.dto';

@Injectable()
export class FingerprintValidator {
  private readonly MIN_TEMPLATE_LENGTH = 100;
  private readonly MAX_TEMPLATE_LENGTH = 10000;
  private readonly MIN_THRESHOLD = 0;
  private readonly MAX_THRESHOLD = 100;

  async validateEnrollment(dto: CreateFingerprintDto): Promise<void> {
    // Validate template data
    if (!this.isValidBase64(dto.template_data)) {
      throw new BadRequestException(
        'Template data harus dalam format Base64 yang valid',
      );
    }

    if (dto.template_data.length < this.MIN_TEMPLATE_LENGTH) {
      throw new BadRequestException(
        `Template data terlalu pendek (minimal ${this.MIN_TEMPLATE_LENGTH} karakter)`,
      );
    }

    if (dto.template_data.length > this.MAX_TEMPLATE_LENGTH) {
      throw new BadRequestException(
        `Template data terlalu panjang (maksimal ${this.MAX_TEMPLATE_LENGTH} karakter)`,
      );
    }

    // Validate match score if provided
    if (dto.match_score !== undefined) {
      if (dto.match_score < 0 || dto.match_score > 100) {
        throw new BadRequestException('Match score harus antara 0-100');
      }
    }
  }

  async validateVerification(dto: VerifyFingerprintDto): Promise<void> {
    // Validate template data
    if (!this.isValidBase64(dto.template_data)) {
      throw new BadRequestException(
        'Template data harus dalam format Base64 yang valid',
      );
    }

    if (dto.template_data.length < this.MIN_TEMPLATE_LENGTH) {
      throw new BadRequestException(
        `Template data terlalu pendek (minimal ${this.MIN_TEMPLATE_LENGTH} karakter)`,
      );
    }

    // Validate threshold if provided
    if (dto.threshold !== undefined) {
      if (
        dto.threshold < this.MIN_THRESHOLD ||
        dto.threshold > this.MAX_THRESHOLD
      ) {
        throw new BadRequestException(
          `Threshold harus antara ${this.MIN_THRESHOLD}-${this.MAX_THRESHOLD}`,
        );
      }
    }
  }

  private isValidBase64(str: string): boolean {
    try {
      // Check if string matches base64 pattern
      const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
      if (!base64Pattern.test(str)) {
        return false;
      }

      // Try to decode
      Buffer.from(str, 'base64');
      return true;
    } catch {
      return false;
    }
  }
}
