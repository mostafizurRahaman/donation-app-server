import { Schema, model } from 'mongoose';
import { IDonationModel } from './donation.interface';
import {
  DONATION_STATUS,
  DONATION_TYPE,
  DEFAULT_CURRENCY,
} from './donation.constant';

const donationSchema = new Schema<IDonationModel>(
  {
    // New Auth-based fields (primary)
    donorAuth: {
      type: Schema.Types.ObjectId,
      ref: 'Auth',
      required: true,
      index: true,
    },
    organizationAuth: {
      type: Schema.Types.ObjectId,
      ref: 'Auth',
      required: true,
      index: true,
    },

    // @deprecated donor (Client reference) - use donorAuth instead
    donor: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: false, // Made optional during migration
      select: false, // Hide by default
    },
    // @deprecated organization (Organization reference) - use organizationAuth instead
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: false, // Made optional during migration
      select: false, // Hide by default
    },
    cause: {
      type: Schema.Types.ObjectId,
      ref: 'Cause',
    },
    donationType: {
      type: String,
      enum: DONATION_TYPE,
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be at least 0.01'],
    },
    currency: {
      type: String,
      default: DEFAULT_CURRENCY,
    },
    status: {
      type: String,
      enum: DONATION_STATUS,
      default: 'pending',
    },
    donationDate: {
      type: Date,
      default: Date.now,
    },
    stripePaymentIntentId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    stripeChargeId: {
      type: String,
    },
    stripeSessionId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    stripeCustomerId: {
      type: String,
    },
    stripePaymentMethodId: {
      type: String,
    },
    specialMessage: {
      type: String,
    },
    refundReason: {
      type: String,
    },
    pointsEarned: {
      type: Number,
      default: 0,
    },
    connectedAccountId: {
      type: String,
    },
    // Additional fields for recurring and round-up donations
    scheduledDonationId: {
      type: Schema.Types.ObjectId,
      ref: 'ScheduledDonation',
    },
    roundUpId: {
      type: Schema.Types.ObjectId,
      ref: 'RoundUp',
    },
    roundUpTransactionIds: {
      type: [Schema.Types.ObjectId],
      ref: 'RoundUpTransaction',
    },
    receiptGenerated: {
      type: Boolean,
      default: false,
    },
    receiptId: {
      type: Schema.Types.ObjectId,
      ref: 'DonationReceipt',
    },
    // New fields for idempotency and payment tracking
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    paymentAttempts: {
      type: Number,
      default: 0,
    },
    lastPaymentAttempt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// New Auth-based indexes (primary)
donationSchema.index({ donorAuth: 1, donationDate: -1 });
donationSchema.index({ organizationAuth: 1, donationDate: -1 });
donationSchema.index({ idempotencyKey: 1, donorAuth: 1 }, { unique: true });

// @deprecated indexes - keeping during migration
donationSchema.index({ donor: 1, donationDate: -1 });
donationSchema.index({ organization: 1, donationDate: -1 });
donationSchema.index({ status: 1, donationDate: -1 });
donationSchema.index({ scheduledDonationId: 1 });
donationSchema.index({ roundUpId: 1 });
donationSchema.index({ idempotencyKey: 1, donor: 1 }, { unique: true });
donationSchema.index({ lastPaymentAttempt: 1 });

export const Donation = model<IDonationModel>('Donation', donationSchema);
export default Donation;
