export type PaymentMethodType = 'credit_card' | 'debit_card' | 'yape' | 'plin' | 'cash';
export type PaymentStatusType = 'APPROVED' | 'REJECTED' | 'PENDING';

export class Payment {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  paymentMethod: PaymentMethodType;
  status: PaymentStatusType;
  cardLast4?: string;
  cardBrand?: string;
  digitalWalletPhone?: string;
  transactionReference: string;
  receiptNumber: string;
  processedAt: Date;
}
