import { Document, Model, Types } from 'mongoose';

export interface IDonationReceipt extends Document {
  _id: Types.ObjectId;
  donationId: Types.ObjectId;
  donorId: Types.ObjectId;
  organizationId: Types.ObjectId;
  receiptNumber: string;
  donationAmount: number;
  donationDate: Date;
  donorName: string;
  organizationName: string;
  organizationABN: string;
  organizationStatus: string; // tax-deductible, zakat-eligible
  paymentMethod: string;
  receiptUrl: string;
  isEmailSent: boolean;
  emailSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IDonationReceiptModel extends Model<IDonationReceipt> {
  // Add any static methods here if needed
}

export interface IReceiptGenerationPayload {
  donationId: string;
  donorId: string;
  organizationId: string;
  donationAmount: number;
  donationDate: Date;
  donorName: string;
  organizationName: string;
  organizationABN: string;
  organizationStatus: string;
  paymentMethod: string;
  stripeDestinationAccount?: string;
}

export interface IReceiptEmailPayload {
  receiptId: string;
  donorEmail: string;
  donorName: string;
  organizationName: string;
}
