// backend/src/payments/domains/services/invoice-generator.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class InvoiceGeneratorService {
  generate(lastInvoice?: string): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    const prefix = `INV/${year}${month}${day}`;

    let sequence = 1;
    if (lastInvoice && lastInvoice.startsWith(prefix)) {
      const parts = lastInvoice.split('/');
      const lastSequence = parts[parts.length - 1];
      sequence = parseInt(lastSequence, 10) + 1;
    }

    return `${prefix}/${String(sequence).padStart(4, '0')}`;
  }

  isValid(invoice: string): boolean {
    const pattern = /^INV\/\d{8}\/\d{4}$/;
    return pattern.test(invoice);
  }

  extractDate(invoice: string): Date | null {
    if (!this.isValid(invoice)) return null;

    const parts = invoice.split('/');
    const dateStr = parts[1];
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));

    return new Date(year, month, day);
  }
}
