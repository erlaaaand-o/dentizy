import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Treatment } from '../../domains/entities/treatments.entity'; // Sesuaikan path entity Anda

@Injectable()
export class TreatmentsIdGenerator {
  constructor(
    @InjectRepository(Treatment)
    private readonly treatmentRepository: Repository<Treatment>,
  ) {}

  async generateKodePerawatan(): Promise<string> {
    // 1. Cari satu data terakhir yang kodenya berawalan 'TRT-'
    // Kita urutkan DESCENDING berdasarkan kodePerawatan atau ID untuk dapat yang paling baru
    const lastTreatment = await this.treatmentRepository.findOne({
      where: {
        kodePerawatan: Like('TRT-%'),
      },
      order: {
        kodePerawatan: 'DESC', // Ambil yang angkanya paling besar
      },
    });

    // 2. Default jika belum ada data sama sekali
    let nextNumber = 1;

    // 3. Jika ada data terakhir, ambil angkanya dan tambah 1
    if (lastTreatment && lastTreatment.kodePerawatan) {
      // Format: TRT-001
      const lastCode = lastTreatment.kodePerawatan;
      const splitCode = lastCode.split('-'); // ['TRT', '001']

      if (splitCode.length > 1) {
        const numberPart = splitCode[1]; // '001'
        const parsedNumber = parseInt(numberPart, 10);

        if (!isNaN(parsedNumber)) {
          nextNumber = parsedNumber + 1;
        }
      }
    }

    // 4. Format ulang menjadi string dengan padding (TRT-002, TRT-010, dll)
    // padStart(3, '0') artinya minimal 3 digit, jika kurang isi dengan '0' di depan
    return `TRT-${nextNumber.toString().padStart(3, '0')}`;
  }
}
