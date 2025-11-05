import { Document, Types } from 'mongoose';

export interface IRoundUpDonation extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  charityId: Types.ObjectId;
  bankAccountId: string; // Basiq account ID
  transactionId: string; // Original transaction ID from Basiq
  originalAmount: number;
  roundUpAmount: number;
  transactionDate: Date;
  merchantName?: string;
  isProcessed: boolean;
  processedAt?: Date;
  monthlyBatch?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMonthlyRoundUpBatch extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  charityId: Types.ObjectId;
  month: number;
  year: number;
  totalAmount: number;
  transactionCount: number;
  isTransferred: boolean;
  transferredAt?: Date;
  stripePaymentIntentId?: string;
  roundUpDonations: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserRoundUpSettings extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  isEnabled: boolean;
  monthlyLimit: number;
  currentMonthTotal: number;
  selectedCharityId?: Types.ObjectId;
  bankAccountId?: string; // Basiq account ID
  basiqConsentId?: string;
  consentExpiryDate?: Date;
  lastSyncDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBasiqCDRConsent extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  consentId: string;
  status: 'active' | 'expired' | 'revoked';
  bankName: string;
  accountIds: string[];
  consentDate: Date;
  expiryDate: Date;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IRoundUpDonationModel {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IMonthlyRoundUpBatchModel {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IUserRoundUpSettingsModel {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IBasiqCDRConsentModel {}

export interface IBasiqTransaction {
  id: string;
  accountId: string;
  amount: string;
  description: string;
  postDate: string;
  transactionDate: string;
  class: string;
  institution: string;
  connection: string;
}

export interface IBasiqAccount {
  id: string;
  name: string;
  accountNo: string;
  balance: string;
  availableFunds: string;
  type: string;
  class: string;
  product: string;
  institution: string;
}

export interface IRoundUpCalculationResult {
  originalAmount: number;
  roundUpAmount: number;
  shouldProcess: boolean;
  reason?: string;
}

export interface IMonthlyTransferPayload {
  userId: string;
  charityId: string;
  totalAmount: number;
  transactionIds: string[];
}

export interface IBasiqConsentPayload {
  userId: string;
  bankName: string;
  consentId: string;
  accountIds: string[];
  expiryDate: Date;
}
