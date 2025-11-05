import { model, Schema } from 'mongoose';
import {
  IDonationReceipt,
  IDonationReceiptModel,
} from './donationReceipt.interface';

const donationReceiptSchema = new Schema<
  IDonationReceipt,
  IDonationReceiptModel
>(
  {
    donationId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Donation ID is required!'],
      ref: 'Donation',
    },
    donorId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Donor ID is required!'],
      ref: 'Auth',
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Organization ID is required!'],
      ref: 'Organization',
    },
    receiptNumber: {
      type: String,
      required: [true, 'Receipt number is required!'],
      unique: true,
    },
    donationAmount: {
      type: Number,
      required: [true, 'Donation amount is required!'],
      min: [0.01, 'Donation amount must be greater than 0'],
    },
    donationDate: {
      type: Date,
      required: [true, 'Donation date is required!'],
    },
    donorName: {
      type: String,
      required: [true, 'Donor name is required!'],
    },
    organizationName: {
      type: String,
      required: [true, 'Organization name is required!'],
    },
    organizationABN: {
      type: String,
      required: [true, 'Organization ABN is required!'],
    },
    organizationStatus: {
      type: String,
      required: [true, 'Organization status is required!'],
      enum: ['tax-deductible', 'zakat-eligible', 'general'],
    },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required!'],
    },
    receiptUrl: {
      type: String,
      required: [true, 'Receipt URL is required!'],
    },
    isEmailSent: {
      type: Boolean,
      default: false,
    },
    emailSentAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Generate unique receipt number before saving
donationReceiptSchema.pre('save', async function (next) {
  if (this.isNew && !this.receiptNumber) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);

    this.receiptNumber = `CC-${year}${month}-${timestamp}`;
  }
  next();
});

const DonationReceipt = model<IDonationReceipt, IDonationReceiptModel>(
  'DonationReceipt',
  donationReceiptSchema
);

export default DonationReceipt;
