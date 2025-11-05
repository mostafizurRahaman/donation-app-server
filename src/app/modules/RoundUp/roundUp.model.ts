import { model, Schema } from 'mongoose';
import {
  IRoundUpDonation,
  IRoundUpDonationModel,
  IMonthlyRoundUpBatch,
  IMonthlyRoundUpBatchModel,
  IUserRoundUpSettings,
  IUserRoundUpSettingsModel,
  IBasiqCDRConsent,
  IBasiqCDRConsentModel,
} from './roundUp.interface';

// Round-Up Donation Schema
const roundUpDonationSchema = new Schema<IRoundUpDonation, IRoundUpDonationModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: [true, 'User ID is required!'],
      ref: 'Auth',
    },
    charityId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Charity ID is required!'],
      ref: 'Organization',
    },
    bankAccountId: {
      type: String,
      required: [true, 'Bank account ID is required!'],
    },
    transactionId: {
      type: String,
      required: [true, 'Transaction ID is required!'],
      unique: true,
    },
    originalAmount: {
      type: Number,
      required: [true, 'Original amount is required!'],
    },
    roundUpAmount: {
      type: Number,
      required: [true, 'Round-up amount is required!'],
      min: [0.01, 'Round-up amount must be greater than 0'],
      max: [0.99, 'Round-up amount cannot exceed 0.99'],
    },
    transactionDate: {
      type: Date,
      required: [true, 'Transaction date is required!'],
    },
    merchantName: {
      type: String,
    },
    isProcessed: {
      type: Boolean,
      default: false,
    },
    processedAt: {
      type: Date,
    },
    monthlyBatch: {
      type: Schema.Types.ObjectId,
      ref: 'MonthlyRoundUpBatch',
    },
  },
  { timestamps: true, versionKey: false }
);

// Monthly Round-Up Batch Schema
const monthlyRoundUpBatchSchema = new Schema<IMonthlyRoundUpBatch, IMonthlyRoundUpBatchModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: [true, 'User ID is required!'],
      ref: 'Auth',
    },
    charityId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Charity ID is required!'],
      ref: 'Organization',
    },
    month: {
      type: Number,
      required: [true, 'Month is required!'],
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: [true, 'Year is required!'],
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required!'],
      min: [0.01, 'Total amount must be greater than 0'],
    },
    transactionCount: {
      type: Number,
      required: [true, 'Transaction count is required!'],
      min: 1,
    },
    isTransferred: {
      type: Boolean,
      default: false,
    },
    transferredAt: {
      type: Date,
    },
    stripePaymentIntentId: {
      type: String,
    },
    roundUpDonations: [{
      type: Schema.Types.ObjectId,
      ref: 'RoundUpDonation',
    }],
  },
  { timestamps: true, versionKey: false }
);

// User Round-Up Settings Schema
const userRoundUpSettingsSchema = new Schema<IUserRoundUpSettings, IUserRoundUpSettingsModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: [true, 'User ID is required!'],
      unique: true,
      ref: 'Auth',
    },
    isEnabled: {
      type: Boolean,
      default: false,
    },
    monthlyLimit: {
      type: Number,
      default: 20,
      min: [1, 'Monthly limit must be at least $1'],
      max: [1000, 'Monthly limit cannot exceed $1000'],
    },
    currentMonthTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    selectedCharityId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
    },
    bankAccountId: {
      type: String,
    },
    basiqConsentId: {
      type: String,
    },
    consentExpiryDate: {
      type: Date,
    },
    lastSyncDate: {
      type: Date,
    },
  },
  { timestamps: true, versionKey: false }
);

// Basiq CDR Consent Schema
const basiqCDRConsentSchema = new Schema<IBasiqCDRConsent, IBasiqCDRConsentModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: [true, 'User ID is required!'],
      ref: 'Auth',
    },
    consentId: {
      type: String,
      required: [true, 'Consent ID is required!'],
      unique: true,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'revoked'],
      default: 'active',
    },
    bankName: {
      type: String,
      required: [true, 'Bank name is required!'],
    },
    accountIds: [{
      type: String,
      required: true,
    }],
    consentDate: {
      type: Date,
      required: [true, 'Consent date is required!'],
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required!'],
    },
    revokedAt: {
      type: Date,
    },
  },
  { timestamps: true, versionKey: false }
);

// Indexes for performance
roundUpDonationSchema.index({ userId: 1, transactionDate: -1 });
roundUpDonationSchema.index({ transactionId: 1 });
roundUpDonationSchema.index({ isProcessed: 1 });

monthlyRoundUpBatchSchema.index({ userId: 1, year: -1, month: -1 });
monthlyRoundUpBatchSchema.index({ isTransferred: 1 });

userRoundUpSettingsSchema.index({ userId: 1 });

basiqCDRConsentSchema.index({ userId: 1 });
basiqCDRConsentSchema.index({ consentId: 1 });
basiqCDRConsentSchema.index({ status: 1, expiryDate: 1 });

// Reset current month total at the beginning of each month
userRoundUpSettingsSchema.pre('save', function (next) {
  // Reset logic would be handled by a cron job or scheduled task
  // This pre-save hook is kept for future implementation
  next();
});

export const RoundUpDonation = model<IRoundUpDonation, IRoundUpDonationModel>(
  'RoundUpDonation',
  roundUpDonationSchema
);

export const MonthlyRoundUpBatch = model<IMonthlyRoundUpBatch, IMonthlyRoundUpBatchModel>(
  'MonthlyRoundUpBatch',
  monthlyRoundUpBatchSchema
);

export const UserRoundUpSettings = model<IUserRoundUpSettings, IUserRoundUpSettingsModel>(
  'UserRoundUpSettings',
  userRoundUpSettingsSchema
);

export const BasiqCDRConsent = model<IBasiqCDRConsent, IBasiqCDRConsentModel>(
  'BasiqCDRConsent',
  basiqCDRConsentSchema
);
