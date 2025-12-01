import { Document, Types } from 'mongoose';


export interface IDonationPayout {
  // References
  donation: Types.ObjectId;
  payout: Types.ObjectId;
  organization: Types.ObjectId;

  // Amount breakdown (snapshot from donation at time of payout request)
  donationBaseAmount: number;
  donationTaxAmount: number;
  donationTotalAmount: number;

  // Payout status for THIS donation
  status:
    | 'pending'
    | 'scheduled'
    | 'paid'
    | 'cancelled'
    | 'failed'
    | 'refunded';

  // Dates
  scheduledDate?: Date;
  paidAt?: Date;
  cancelledAt?: Date;

  // Stripe references
  stripeTransferId?: string;

  // Audit trail
  includedInPayoutAt: Date;
  requestedBy: Types.ObjectId;
  executedBy?: Types.ObjectId | 'system';

  // Notes
  notes?: string;

  // Metadata
  metadata?: {
    payoutBatchNumber?: string;
    donationType?: 'one-time' | 'recurring' | 'round-up';
    causeName?: string;
  };

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IDonationPayoutModel extends IDonationPayout, Document {}

// Query result types
export interface IDonationPayoutDetails extends IDonationPayout {
  donationDetails?: {
    donor: string;
    amount: number;
    donationDate: Date;
    cause: string;
  };
  payoutDetails?: {
    payoutAmount: number;
    scheduledDate: Date;
    status: string;
  };
}
