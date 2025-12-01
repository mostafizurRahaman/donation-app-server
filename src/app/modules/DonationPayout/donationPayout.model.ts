import { Schema, model } from 'mongoose';
import { IDonationPayoutModel } from './donationPayout.interface';

const donationPayoutSchema = new Schema<IDonationPayoutModel>(
  {
    // References
    donation: {
      type: Schema.Types.ObjectId,
      ref: 'Donation',
      required: true,
      index: true,
    },

    payout: {
      type: Schema.Types.ObjectId,
      ref: 'Payout',
      required: true,
      index: true,
    },

    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },

    // Amount snapshot
    donationBaseAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    donationTaxAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    donationTotalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Status
    status: {
      type: String,
      enum: ['pending', 'scheduled', 'paid', 'cancelled', 'failed', 'refunded'],
      default: 'pending',
      required: true,
      index: true,
    },

    // Dates
    scheduledDate: {
      type: Date,
      index: true,
    },
    paidAt: {
      type: Date,
      index: true,
    },
    cancelledAt: {
      type: Date,
    },

    // Stripe reference
    stripeTransferId: {
      type: String,
      index: true,
      sparse: true,
    },

    // Audit
    includedInPayoutAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Auth',
      required: true,
    },
    executedBy: {
      type: Schema.Types.Mixed, // ObjectId or 'system'
    },

    // Notes
    notes: {
      type: String,
      maxlength: 500,
    },

    // Metadata
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Ensure each donation can only be in ONE active payout at a time
donationPayoutSchema.index(
  { donation: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['scheduled', 'processing'] },
    },
  }
);

// Additional indexes
donationPayoutSchema.index({ donation: 1, payout: 1 }, { unique: true });
donationPayoutSchema.index({ organization: 1, status: 1 });
donationPayoutSchema.index({ organization: 1, paidAt: -1 });
donationPayoutSchema.index({ payout: 1, status: 1 });
donationPayoutSchema.index({ status: 1, scheduledDate: 1 });

export const DonationPayout = model<IDonationPayoutModel>(
  'DonationPayout',
  donationPayoutSchema
);

export default DonationPayout;
