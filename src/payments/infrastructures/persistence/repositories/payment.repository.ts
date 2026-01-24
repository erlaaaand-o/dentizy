import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  FindOptionsWhere,
  DataSource,
  Brackets,
  EntityManager,
} from 'typeorm';

import { Payment } from '../../../domains/entities/payments.entity';
import { CreatePaymentDto } from '../../../applications/dto/create-payment.dto';
import { UpdatePaymentDto } from '../../../applications/dto/update-payment.dto';
import { QueryPaymentDto } from '../../../applications/dto/query-payment.dto';
import { InvoiceGeneratorService } from '../../../domains/services/invoice-generator.service';

interface PaginatedResult {
  data: Payment[];
  total: number;
}

@Injectable()
export class PaymentRepository {
  constructor(
    @InjectRepository(Payment)
    private readonly repository: Repository<Payment>,
    private readonly invoiceGenerator: InvoiceGeneratorService,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreatePaymentDto): Promise<Payment> {
    return await this.dataSource.transaction(async (manager) => {
      const paymentRepo = manager.getRepository(Payment);

      const { totalBiaya = 0, jumlahBayar } = dto;

      const totalAkhir = totalBiaya;
      const kembalian = jumlahBayar - totalAkhir;

      const lastPayment = await this.getLastPaymentToday(manager);
      const nomorInvoice = this.invoiceGenerator.generate(
        lastPayment?.nomorInvoice,
      );

      const payment = paymentRepo.create({
        ...dto,
        nomorInvoice,
        totalAkhir,
        kembalian: kembalian > 0 ? kembalian : 0,
        tanggalPembayaran: new Date(dto.tanggalPembayaran),
      });

      return await paymentRepo.save(payment);
    });
  }

  async findAll(query: QueryPaymentDto): Promise<PaginatedResult> {
    const {
      medicalRecordId,
      patientId,
      statusPembayaran,
      metodePembayaran,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 10,
    } = query;
    const skip = (page - 1) * limit;

    const qb = this.repository.createQueryBuilder('payment');

    // JOIN RELASI
    qb.leftJoinAndSelect('payment.patient', 'patient');
    qb.leftJoinAndSelect('payment.medicalRecord', 'medicalRecord');

    // FILTERING
    if (medicalRecordId) {
      qb.andWhere('payment.medicalRecordId = :medicalRecordId', {
        medicalRecordId,
      });
    }

    if (patientId) {
      qb.andWhere('payment.patientId = :patientId', { patientId });
    }

    if (statusPembayaran) {
      qb.andWhere('payment.statusPembayaran = :statusPembayaran', {
        statusPembayaran,
      });
    }

    if (metodePembayaran) {
      qb.andWhere('payment.metodePembayaran = :metodePembayaran', {
        metodePembayaran,
      });
    }

    if (startDate && endDate) {
      qb.andWhere('payment.tanggalPembayaran BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    }

    // Search: Bisa cari by Nomor Invoice ATAU Nama Pasien
    if (search) {
      qb.andWhere(
        new Brackets((sub) => {
          sub
            .where('payment.nomorInvoice LIKE :search', {
              search: `%${search}%`,
            })
            .orWhere('patient.nama_lengkap LIKE :search', {
              search: `%${search}%`,
            });
        }),
      );
    }

    // SORTING & PAGINATION
    qb.orderBy('payment.createdAt', 'DESC');
    qb.skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return { data, total };
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.repository.findOne({
      where: { id },
      relations: ['patient', 'medicalRecord'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  async findByNomorInvoice(nomorInvoice: string): Promise<Payment | null> {
    return await this.repository.findOne({
      where: { nomorInvoice },
      relations: ['patient', 'medicalRecord'],
    });
  }

  async findByMedicalRecordId(
    medicalRecordId: string,
  ): Promise<Payment | null> {
    return await this.repository.findOne({
      where: { medicalRecordId },
      order: { createdAt: 'DESC' },
      relations: ['patient'],
    });
  }

  async update(
    id: string,
    dto: UpdatePaymentDto,
    updatedBy?: string,
  ): Promise<Payment> {
    return await this.dataSource.transaction(async (manager) => {
      const paymentRepo = manager.getRepository(Payment);
      const existing = await paymentRepo.findOne({ where: { id } });

      if (!existing) {
        throw new NotFoundException(`Payment with ID ${id} not found`);
      }

      const totalBiaya = dto.totalBiaya ?? Number(existing.totalBiaya);
      const jumlahBayar = dto.jumlahBayar ?? Number(existing.jumlahBayar);

      const totalAkhir = totalBiaya;
      const kembalian = Math.max(0, jumlahBayar - totalAkhir);

      await paymentRepo.update(id, {
        ...dto,
        totalBiaya,
        jumlahBayar,
        totalAkhir,
        kembalian,
        updatedBy: updatedBy, // Jika undefined, tidak akan mengupdate kolom (aman)
        tanggalPembayaran: dto.tanggalPembayaran
          ? new Date(dto.tanggalPembayaran)
          : undefined, // Biarkan undefined jika tidak ada update tanggal (jangan null kecuali ingin menghapus)
      });

      // Return updated data dengan relasi
      const updatedPayment = await paymentRepo.findOne({
        where: { id },
        relations: ['patient'],
      });

      if (!updatedPayment) {
        throw new NotFoundException(
          `Payment with ID ${id} not found after update`,
        );
      }

      return updatedPayment;
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  async restore(id: string): Promise<void> {
    await this.repository.restore(id);
  }

  async getTotalRevenue(startDate?: Date, endDate?: Date): Promise<number> {
    const query = this.repository
      .createQueryBuilder('payment')
      .select('SUM(payment.totalAkhir)', 'total')
      .where('payment.statusPembayaran = :status', { status: 'lunas' })
      .andWhere('payment.deletedAt IS NULL');

    if (startDate && endDate) {
      query.andWhere(
        'payment.tanggalPembayaran BETWEEN :startDate AND :endDate',
        {
          startDate,
          endDate,
        },
      );
    }

    const result = await query.getRawOne<{ total: string | null }>();
    return parseFloat(result?.total || '0');
  }

  async count(where?: FindOptionsWhere<Payment>): Promise<number> {
    return await this.repository.count({ where });
  }

  private async getLastPaymentToday(
    manager: EntityManager,
  ): Promise<Payment | null> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const prefix = `INV/${year}${month}${day}`;

    return await manager
      .getRepository(Payment)
      .createQueryBuilder('payment')
      .where('payment.nomorInvoice LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('payment.nomorInvoice', 'DESC')
      .getOne();
  }
}
