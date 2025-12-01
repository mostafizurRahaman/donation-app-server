import { Document, Types } from 'mongoose';

export interface IPayout {
  // Basic Info
  organization: Types.ObjectId;

  // Request Info
  requestedBy: Types.ObjectId;
  requestedAt: Date;

  // Amount Breakdown
  totalBaseAmount: number;
  totalTaxAmount: number;
  totalAmount: number;
  platformFee: number;
  platformFeePercentage: number;
  organizationReceives: number;

  // Scheduling
  scheduledDate: Date;
  scheduledTime?: string;

  // Execution
  executedAt?: Date;
  executedBy?: Types.ObjectId | 'system';
  actualPayoutDate?: Date;

  // Status
  status: 'scheduled' | 'processing' | 'completed' | 'cancelled' | 'failed';

  // Stripe Details
  stripeTransferId?: string;
  stripeTransferUrl?: string;

  // Cancellation
  cancelled: boolean;
  cancelledBy?: Types.ObjectId;
  cancelledAt?: Date;
  cancellationReason?: string;
  canReschedule?: boolean;

  // Donation Count
  donationCount: number;

  // Notes
  organizationNotes?: string;
  adminNotes?: string;

  // Metadata
  metadata?: {
    donationCount: number;
    periodStart?: Date;
    periodEnd?: Date;
    causeBreakdown?: {
      [causeId: string]: {
        causeId: string;
        causeName: string;
        amount: number;
        count: number;
      };
    };
    typeBreakdown?: {
      oneTime: { amount: number; count: number };
      recurring: { amount: number; count: number };
      roundUp: { amount: number; count: number };
    };
  };

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPayoutModel extends IPayout, Document {
  calculateFees: () => void;
}

// Request/Response interfaces
export interface IPayoutRequest {
  requestedAmount?: number | 'all';
  scheduledDate: Date;
  notes?: string;
  causeIds?: string[];
  donationType?: 'one-time' | 'recurring' | 'round-up' | 'all';
}

export interface IPayoutSummary {
  pendingAmount: number;
  scheduledAmount: number;
  paidAmount: number;
  totalDonations: number;
  platformFeeRate: number;
  nextScheduledPayout?: IPayout;
  lastCompletedPayout?: IPayout;
  stripeConnectStatus: {
    isConnected: boolean;
    isReady: boolean;
    issues: string[];
  };
}

export interface IPayoutFilters {
  status?: string;
  startDate?: Date;
  endDate?: Date;
  organizationId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IPayoutHistory {
  payouts: IPayout[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IAvailableDonations {
  donations: any[];
  count: number;
  totals: {
    baseAmount: number;
    taxAmount: number;
    totalAmount: number;
    platformFee: number;
    organizationReceives: number;
  };
}
