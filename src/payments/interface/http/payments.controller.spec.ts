// // backend/src/payments/applications/orchestrator/payments.service.spec.ts
// import { Test, TestingModule } from '@nestjs/testing';
// import { PaymentsService } from './payments.service';
// import { CreatePaymentUseCase } from '../use-cases/create-payment.use-case';
// import { UpdatePaymentUseCase } from '../use-cases/update-payment.use-case';
// import { CancelPaymentUseCase } from '../use-cases/cancel-payment.use-case';
// import { DeletePaymentUseCase } from '../use-cases/delete-payment.use-case';
// import { GetPaymentListUseCase } from '../use-cases/get-payment-list.use-case';
// import { GetPaymentDetailUseCase } from '../use-cases/get-payment-detail.use-case';

// describe('PaymentsService', () => {
//     let service: PaymentsService;
//     let createUseCase: CreatePaymentUseCase;

//     const mockCreateUseCase = {
//         execute: jest.fn(),
//     };

//     beforeEach(async () => {
//         const module: TestingModule = await Test.createTestingModule({
//             providers: [
//                 PaymentsService,
//                 {
//                     provide: CreatePaymentUseCase,
//                     useValue: mockCreateUseCase,
//                 },
//                 {
//                     provide: UpdatePaymentUseCase,
//                     useValue: { execute: jest.fn() },
//                 },
//                 {
//                     provide: CancelPaymentUseCase,
//                     useValue: { execute: jest.fn() },
//                 },
//                 {
//                     provide: DeletePaymentUseCase,
//                     useValue: { execute: jest.fn() },
//                 },
//                 {
//                     provide: GetPaymentListUseCase,
//                     useValue: { execute: jest.fn() },
//                 },
//                 {
//                     provide: GetPaymentDetailUseCase,
//                     useValue: { execute: jest.fn() },
//                 },
//                 // Add other mocked dependencies...
//             ],
//         }).compile();

//         service = module.get<PaymentsService>(PaymentsService);
//         createUseCase = module.get<CreatePaymentUseCase>(CreatePaymentUseCase);
//     });

//     it('should be defined', () => {
//         expect(service).toBeDefined();
//     });

//     describe('create', () => {
//         it('should create a payment successfully', async () => {
//             const dto = {
//                 medicalRecordId: 1,
//                 patientId: 1,
//                 tanggalPembayaran: '2024-01-15',
//                 totalBiaya: 500000,
//                 jumlahBayar: 500000,
//                 metodePembayaran: 'tunai' as any,
//             };

//             const expectedResult = {
//                 id: 1,
//                 ...dto,
//                 nomorInvoice: 'INV/20240115/0001',
//             };

//             mockCreateUseCase.execute.mockResolvedValue(expectedResult);

//             const result = await service.create(dto);

//             expect(result).toEqual(expectedResult);
//             expect(createUseCase.execute).toHaveBeenCalledWith(dto);
//         });
//     });
// });

// // backend/src/payments/domains/services/payment-calculator.service.spec.ts
// import { Test, TestingModule } from '@nestjs/testing';
// import { PaymentCalculatorService } from './payment-calculator.service';
// import { StatusPembayaran } from '../entities/payment.entity';

// describe('PaymentCalculatorService', () => {
//     let service: PaymentCalculatorService;

//     beforeEach(async () => {
//         const module: TestingModule = await Test.createTestingModule({
//             providers: [PaymentCalculatorService],
//         }).compile();

//         service = module.get<PaymentCalculatorService>(PaymentCalculatorService);
//     });

//     it('should calculate full payment correctly', () => {
//         const result = service.calculate(500000, 50000, 450000);

//         expect(result.totalAkhir).toBe(450000);
//         expect(result.kembalian).toBe(0);
//         expect(result.statusPembayaran).toBe(StatusPembayaran.LUNAS);
//     });

//     it('should calculate partial payment correctly', () => {
//         const result = service.calculate(500000, 50000, 200000);

//         expect(result.totalAkhir).toBe(450000);
//         expect(result.kembalian).toBe(0);
//         expect(result.statusPembayaran).toBe(StatusPembayaran.SEBAGIAN);
//     });

//     it('should calculate overpayment with change', () => {
//         const result = service.calculate(500000, 50000, 500000);

//         expect(result.totalAkhir).toBe(450000);
//         expect(result.kembalian).toBe(50000);
//         expect(result.statusPembayaran).toBe(StatusPembayaran.LUNAS);
//     });

//     it('should validate payment amounts', () => {
//         const validation = service.validatePaymentAmount(500000, 50000, 450000);

//         expect(validation.valid).toBe(true);
//     });

//     it('should reject invalid discount', () => {
//         const validation = service.validatePaymentAmount(500000, 600000, 0);

//         expect(validation.valid).toBe(false);
//         expect(validation.message).toContain('Diskon tidak boleh lebih besar');
//     });
// });

// // backend/src/payments/domains/services/invoice-generator.service.spec.ts
// import { Test, TestingModule } from '@nestjs/testing';
// import { InvoiceGeneratorService } from './invoice-generator.service';

// describe('InvoiceGeneratorService', () => {
//     let service: InvoiceGeneratorService;

//     beforeEach(async () => {
//         const module: TestingModule = await Test.createTestingModule({
//             providers: [InvoiceGeneratorService],
//         }).compile();

//         service = module.get<InvoiceGeneratorService>(InvoiceGeneratorService);
//     });

//     it('should generate invoice with correct format', () => {
//         const invoice = service.generate();

//         expect(invoice).toMatch(/^INV\/\d{8}\/\d{4}$/);
//     });

//     it('should increment sequence for same day invoices', () => {
//         const today = new Date();
//         const year = today.getFullYear();
//         const month = String(today.getMonth() + 1).padStart(2, '0');
//         const day = String(today.getDate()).padStart(2, '0');

//         const lastInvoice = `INV/${year}${month}${day}/0001`;
//         const newInvoice = service.generate(lastInvoice);

//         expect(newInvoice).toBe(`INV/${year}${month}${day}/0002`);
//     });

//     it('should validate invoice format', () => {
//         expect(service.isValid('INV/20240115/0001')).toBe(true);
//         expect(service.isValid('INVALID')).toBe(false);
//         expect(service.isValid('INV/2024/0001')).toBe(false);
//     });

//     it('should extract date from invoice', () => {
//         const invoice = 'INV/20240115/0001';
//         const date = service.extractDate(invoice);

//         expect(date).toBeInstanceOf(Date);
//         expect(date?.getFullYear()).toBe(2024);
//         expect(date?.getMonth()).toBe(0); // January (0-indexed)
//         expect(date?.getDate()).toBe(15);
//     });
// });
