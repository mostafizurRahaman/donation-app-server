import { Schema, model } from 'mongoose';
import { IPayoutModel } from './payout.interface';

const payoutSchema = new Schema<IPayoutModel>(
  {
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },

    // Request Info
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Auth',
      required: true,
    },
    requestedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },

    // Amount Breakdown
    totalBaseAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    totalTaxAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    platformFee: {
      type: Number,
      required: true,
      min: 0,
    },
    platformFeePercentage: {
      type: Number,
      required: true,
      default: 2.9,
    },
    organizationReceives: {
      type: Number,
      required: true,
      min: 0,
    },

    // Scheduling
    scheduledDate: {
      type: Date,
      required: true,
      index: true,
    },
    scheduledTime: {
      type: String,
      default: '09:00:00',
    },

    // Execution
    executedAt: {
      type: Date,
      index: true,
    },
    executedBy: {
      type: Schema.Types.Mixed,
    },
    actualPayoutDate: {
      type: Date,
    },

    // Status
    status: {
      type: String,
      enum: ['scheduled', 'processing', 'completed', 'cancelled', 'failed'],
      default: 'scheduled',
      required: true,
      index: true,
    },

    // Stripe Details
    stripeTransferId: {
      type: String,
      index: true,
      sparse: true,
    },
    stripeTransferUrl: {
      type: String,
    },

    // Cancellation
    cancelled: {
      type: Boolean,
      default: false,
      index: true,
    },
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: 'Auth',
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
      maxlength: 500,
    },
    canReschedule: {
      type: Boolean,
      default: true,
    },

    // Donation Count
    donationCount: {
      type: Number,
      required: true,
      min: 1,
    },

    // Notes
    organizationNotes: {
      type: String,
      maxlength: 1000,
    },
    adminNotes: {
      type: String,
      maxlength: 1000,
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

// Indexes for efficient queries
payoutSchema.index({ organization: 1, status: 1 });
payoutSchema.index({ organization: 1, scheduledDate: 1 });
payoutSchema.index({ scheduledDate: 1, status: 1, cancelled: 1 });
payoutSchema.index({ organization: 1, executedAt: -1 });
payoutSchema.index({ stripeTransferId: 1 });

// Virtual to get donations (via junction table)
payoutSchema.virtual('donations', {
  ref: 'DonationPayout',
  localField: '_id',
  foreignField: 'payout',
});

// Enable virtuals in JSON/Object output
payoutSchema.set('toJSON', { virtuals: true });
payoutSchema.set('toObject', { virtuals: true });

// Virtual for checking if payout can be executed
payoutSchema.virtual('canExecute').get(function () {
  return (
    this.status === 'scheduled' &&
    !this.cancelled &&
    this.scheduledDate <= new Date()
  );
});

// Method to calculate platform fee
payoutSchema.methods.calculateFees = function (this: IPayoutModel) {
  this.platformFee = parseFloat(
    (this.totalAmount * (this.platformFeePercentage / 100)).toFixed(2)
  );
  this.organizationReceives = parseFloat(
    (this.totalAmount - this.platformFee).toFixed(2)
  );
  return this.organizationReceives;
};

// Pre-save hook to calculate fees
payoutSchema.pre('save', function (this: IPayoutModel, next) {
  if (
    this.isNew ||
    this.isModified('totalAmount') ||
    this.isModified('platformFeePercentage')
  ) {
    this.calculateFees();
  }
  next();
});

export const Payout = model<IPayoutModel>('Payout', payoutSchema);
export default Payout;
