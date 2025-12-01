import httpStatus from 'http-status';
import { Types, ClientSession } from 'mongoose';
import { AppError } from '../../utils';
import Payout from './payout.model';

import Donation from '../Donation/donation.model';
import Organization from '../Organization/organization.model';
import DonationPayout from '../DonationPayout/donationPayout.model';
import { StripeService } from '../Stripe/stripe.service';
import {
  DEFAULT_PLATFORM_FEE_PERCENTAGE,
  MIN_PAYOUT_AMOUNT,
} from './payout.constant';
import {
  IPayoutRequest,
  IPayoutSummary,
  IPayoutFilters,
  IPayoutHistory,
  IAvailableDonations,
} from './payout.interface';
import { OrganizationService } from '../Organization/organization.service';

type TDonationDoc = typeof Donation.prototype;

/**
 * Get available donations for payout (not yet included in any active payout)
 */
const getAvailableDonationsForPayout = async (
  organizationId: string,
  filters?: {
    causeIds?: string[];
    donationType?: 'one-time' | 'recurring' | 'round-up' | 'all';
    startDate?: Date;
    endDate?: Date;
  }
): Promise<IAvailableDonations> => {
  // 1. Find donation IDs already in active payouts (scheduled/processing)
  const donationsInActivePayouts: Types.ObjectId[] = (await DonationPayout.find(
    {
      organization: new Types.ObjectId(organizationId),
      status: { $in: ['scheduled', 'processing'] },
    }
  ).distinct('donation')) as Types.ObjectId[];

  // 2. Build query for available donations
  const query: Record<string, unknown> = {
    organization: new Types.ObjectId(organizationId),
    status: 'completed',
    _id: { $nin: donationsInActivePayouts },
  };

  if (filters?.causeIds && filters.causeIds.length > 0) {
    query.cause = {
      $in: filters.causeIds.map((id) => new Types.ObjectId(id)),
    };
  }

  if (filters?.donationType && filters.donationType !== 'all') {
    query.donationType = filters.donationType;
  }

  if (filters?.startDate || filters?.endDate) {
    query.donationDate = {};
    if (filters.startDate) (query.donationDate as any).$gte = filters.startDate;
    if (filters.endDate) (query.donationDate as any).$lte = filters.endDate;
  }

  const donations = (await Donation.find(query)
    .populate('cause', 'name category')
    .populate('donor', 'name email image')
    .sort({ donationDate: -1 })) as unknown as TDonationDoc[];

  const totals = donations.reduce(
    (acc, d) => {
      const base = d.amount || 0;
      const tax = d.taxAmount || 0;
      const total = d.totalAmount || 0;

      acc.baseAmount += base;
      acc.taxAmount += tax;
      acc.totalAmount += total;
      return acc;
    },
    { baseAmount: 0, taxAmount: 0, totalAmount: 0 }
  );

  const platformFee =
    totals.totalAmount * (DEFAULT_PLATFORM_FEE_PERCENTAGE / 100);
  const organizationReceives = totals.totalAmount - platformFee;

  return {
    donations,
    count: donations.length,
    totals: {
      baseAmount: parseFloat(totals.baseAmount.toFixed(2)),
      taxAmount: parseFloat(totals.taxAmount.toFixed(2)),
      totalAmount: parseFloat(totals.totalAmount.toFixed(2)),
      platformFee: parseFloat(platformFee.toFixed(2)),
      organizationReceives: parseFloat(organizationReceives.toFixed(2)),
    },
  };
};

/**
 * Request a payout for an organization
 */
const requestPayout = async (
  organizationId: string,
  requestedBy: string,
  payload: IPayoutRequest
) => {
  const session: ClientSession = await Payout.startSession();
  session.startTransaction();

  try {
    // Validate organization exists
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      throw new AppError(httpStatus.NOT_FOUND, 'Organization not found');
    }

    // Validate Stripe Connect account is ready
    const validation =
      await OrganizationService.validateStripeConnectForPayouts(organizationId);

    if (!validation.isReady || !validation.accountId) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Cannot request payout: ${validation.issues.join(', ')}`
      );
    }

    // Validate scheduled date
    const scheduledDate = new Date(payload.scheduledDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (scheduledDate < today) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Scheduled date must be today or in the future'
      );
    }

    // Get available donations
    const available = await getAvailableDonationsForPayout(organizationId, {
      causeIds: payload.causeIds,
      donationType: payload.donationType,
    });

    if (available.count === 0) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'No donations available for payout'
      );
    }

    if (available.totals.organizationReceives < MIN_PAYOUT_AMOUNT) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Minimum payout amount is $${MIN_PAYOUT_AMOUNT}`
      );
    }

    // Optional: handle partial payout request
    let selectedDonations = available.donations;
    let selectedTotals = available.totals;

    if (
      payload.requestedAmount &&
      payload.requestedAmount !== 'all' &&
      payload.requestedAmount > 0 &&
      payload.requestedAmount < available.totals.organizationReceives
    ) {
      let runningTotal = 0;
      const partial: TDonationDoc[] = [];

      for (const d of available.donations) {
        const amount = d.totalAmount || 0;
        if (runningTotal + amount <= payload.requestedAmount) {
          partial.push(d);
          runningTotal += amount;
        } else {
          break;
        }
      }

      if (partial.length === 0) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          'Requested amount is too low for available donations'
        );
      }

      selectedDonations = partial;

      const newTotals = partial.reduce(
        (acc, d) => {
          acc.baseAmount += d.amount || 0;
          acc.taxAmount += d.taxAmount || 0;
          acc.totalAmount += d.totalAmount || 0;
          return acc;
        },
        { baseAmount: 0, taxAmount: 0, totalAmount: 0 }
      );

      const platformFee =
        newTotals.totalAmount * (DEFAULT_PLATFORM_FEE_PERCENTAGE / 100);
      const orgReceives = newTotals.totalAmount - platformFee;

      selectedTotals = {
        baseAmount: parseFloat(newTotals.baseAmount.toFixed(2)),
        taxAmount: parseFloat(newTotals.taxAmount.toFixed(2)),
        totalAmount: parseFloat(newTotals.totalAmount.toFixed(2)),
        platformFee: parseFloat(platformFee.toFixed(2)),
        organizationReceives: parseFloat(orgReceives.toFixed(2)),
      };
    }

    // Create payout record
    const [payout] = await Payout.create(
      [
        {
          organization: new Types.ObjectId(organizationId),
          requestedBy: new Types.ObjectId(requestedBy),
          requestedAt: new Date(),
          totalBaseAmount: selectedTotals.baseAmount,
          totalTaxAmount: selectedTotals.taxAmount,
          totalAmount: selectedTotals.totalAmount,
          platformFeePercentage: DEFAULT_PLATFORM_FEE_PERCENTAGE,
          platformFee: selectedTotals.platformFee,
          organizationReceives: selectedTotals.organizationReceives,
          scheduledDate,
          scheduledTime: '09:00:00',
          status: 'scheduled',
          cancelled: false,
          donationCount: selectedDonations.length,
          organizationNotes: payload.notes,
          metadata: {
            donationCount: selectedDonations.length,
            periodStart:
              selectedDonations[selectedDonations.length - 1]?.donationDate,
            periodEnd: selectedDonations[0]?.donationDate,
            requestedAmount: payload.requestedAmount || 'all',
          },
        },
      ],
      { session }
    );

    // Create DonationPayout records
    const donationPayoutDocs = selectedDonations.map((donation) => ({
      donation: donation._id,
      payout: payout._id,
      organization: new Types.ObjectId(organizationId),
      donationBaseAmount: donation.amount,
      donationTaxAmount: donation.taxAmount || 0,
      donationTotalAmount: donation.totalAmount,
      status: 'scheduled',
      scheduledDate,
      includedInPayoutAt: new Date(),
      requestedBy: new Types.ObjectId(requestedBy),
      metadata: {
        donationType: donation.donationType,
        causeName: (donation.cause as any)?.name,
      },
    }));

    await DonationPayout.insertMany(donationPayoutDocs, { session });

    await session.commitTransaction();

    return payout;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Execute payout: transfer from platform to organization's Connect account
 */
const executePayout = async (
  payoutId: string,
  executedBy: string | 'system'
) => {
  const session: ClientSession = await Payout.startSession();
  session.startTransaction();

  try {
    const payout = await Payout.findById(payoutId)
      .populate('organization')
      .session(session);

    if (!payout) {
      throw new AppError(httpStatus.NOT_FOUND, 'Payout not found');
    }

    if (payout.status !== 'scheduled' || payout.cancelled) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Only scheduled payouts can be executed'
      );
    }

    const organization = payout.organization as any;

    if (!organization.stripeConnectAccountId) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Organization has not completed Stripe Connect onboarding'
      );
    }

    // Re-validate Stripe Connect before executing
    const validation =
      await OrganizationService.validateStripeConnectForPayouts(
        organization._id.toString()
      );

    if (!validation.isReady || !validation.accountId) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Cannot execute payout: ${validation.issues.join(', ')}`
      );
    }

    // Update payout status to processing
    payout.status = 'processing';
    await payout.save({ session });

    // Create Stripe transfer
    const transfer = await StripeService.createManualTransfer(
      payout.organizationReceives,
      validation.accountId,
      {
        payoutId: payout?._id?.toString()!,
        organizationId: organization._id.toString(),
        organizationName: organization.name || '',
        donationCount: payout.donationCount.toString(),
        baseAmount: payout.totalBaseAmount.toString(),
        taxAmount: payout.totalTaxAmount.toString(),
        totalAmount: payout.totalAmount.toString(),
        platformFee: payout.platformFee.toString(),
        netAmount: payout.organizationReceives.toString(),
        description: `Payout for ${payout.donationCount} donations`,
      }
    );

    // Update payout record
    payout.status = 'completed';
    payout.stripeTransferId = transfer.id;
    payout.executedAt = new Date();
    payout.actualPayoutDate = new Date();
    payout.executedBy =
      executedBy === 'system' ? 'system' : new Types.ObjectId(executedBy);

    await payout.save({ session });

    // Update all DonationPayout records
    await DonationPayout.updateMany(
      { payout: payout._id },
      {
        status: 'paid',
        paidAt: new Date(),
        stripeTransferId: transfer.id,
        executedBy:
          executedBy === 'system' ? 'system' : new Types.ObjectId(executedBy),
      },
      { session }
    );

    await session.commitTransaction();

    return {
      payout,
      transfer,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Cancel a scheduled payout
 */
const cancelPayout = async (
  payoutId: string,
  cancelledBy: string,
  reason: string
) => {
  const session: ClientSession = await Payout.startSession();
  session.startTransaction();

  try {
    const payout = await Payout.findById(payoutId).session(session);

    if (!payout) {
      throw new AppError(httpStatus.NOT_FOUND, 'Payout not found');
    }

    if (payout.status !== 'scheduled' || payout.cancelled) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Only non-cancelled scheduled payouts can be cancelled'
      );
    }

    payout.status = 'cancelled';
    payout.cancelled = true;
    payout.cancelledBy = new Types.ObjectId(cancelledBy);
    payout.cancelledAt = new Date();
    payout.cancellationReason = reason;
    payout.canReschedule = true;

    await payout.save({ session });

    // Update DonationPayout records
    await DonationPayout.updateMany(
      { payout: payout._id },
      {
        status: 'cancelled',
        cancelledAt: new Date(),
      },
      { session }
    );

    await session.commitTransaction();

    return payout;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Get payout donations (junction records + populated donations)
 */
const getPayoutDonations = async (payoutId: string) => {
  const donationPayouts = await DonationPayout.find({
    payout: new Types.ObjectId(payoutId),
  })
    .populate({
      path: 'donation',
      populate: [
        { path: 'donor', select: 'name email image' },
        { path: 'cause', select: 'name category' },
      ],
    })
    .sort({ includedInPayoutAt: -1 });

  return donationPayouts;
};

/**
 * Get payout summary for organization dashboard
 */
const getPayoutSummary = async (
  organizationId: string
): Promise<IPayoutSummary> => {
  // Available (pending) donations
  const available = await getAvailableDonationsForPayout(organizationId);

  // Scheduled payouts
  const scheduledPayouts = await Payout.find({
    organization: new Types.ObjectId(organizationId),
    status: 'scheduled',
    cancelled: false,
  });

  const scheduledAmount = scheduledPayouts.reduce(
    (sum, p) => sum + p.organizationReceives,
    0
  );

  // Completed payouts
  const completedPayouts = await Payout.find({
    organization: new Types.ObjectId(organizationId),
    status: 'completed',
  });

  const paidAmount = completedPayouts.reduce(
    (sum, p) => sum + p.organizationReceives,
    0
  );

  // Next scheduled payout
  const nextScheduled = await Payout.findOne({
    organization: new Types.ObjectId(organizationId),
    status: 'scheduled',
    cancelled: false,
  }).sort({ scheduledDate: 1 });

  // Last completed payout
  const lastCompleted = await Payout.findOne({
    organization: new Types.ObjectId(organizationId),
    status: 'completed',
  }).sort({ executedAt: -1 });

  // Stripe Connect status
  const validation = await OrganizationService.validateStripeConnectForPayouts(
    organizationId
  );

  return {
    pendingAmount: available.totals.organizationReceives,
    scheduledAmount: parseFloat(scheduledAmount.toFixed(2)),
    paidAmount: parseFloat(paidAmount.toFixed(2)),
    totalDonations: available.count,
    platformFeeRate: DEFAULT_PLATFORM_FEE_PERCENTAGE,
    nextScheduledPayout: nextScheduled || undefined,
    lastCompletedPayout: lastCompleted || undefined,
    stripeConnectStatus: {
      isConnected: !!validation.accountId,
      isReady: validation.isReady,
      issues: validation.issues,
    },
  };
};

/**
 * Get payout history for organization
 */
const getPayoutHistory = async (
  organizationId: string,
  filters?: IPayoutFilters
): Promise<IPayoutHistory> => {
  const query: Record<string, unknown> = {
    organization: new Types.ObjectId(organizationId),
  };

  if (filters?.status) {
    query.status = filters.status;
  }

  if (filters?.startDate || filters?.endDate) {
    query.executedAt = {};
    if (filters.startDate) (query.executedAt as any).$gte = filters.startDate;
    if (filters.endDate) (query.executedAt as any).$lte = filters.endDate;
  }

  const page = filters?.page && filters.page > 0 ? filters.page : 1;
  const limit =
    filters?.limit && filters.limit > 0 && filters.limit <= 100
      ? filters.limit
      : 20;
  const skip = (page - 1) * limit;

  const [payouts, total] = await Promise.all([
    Payout.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('requestedBy', 'email')
      .populate('executedBy', 'email'),
    Payout.countDocuments(query),
  ]);

  return {
    payouts,
    total,
    page,
    limit,
    totalPages: total > 0 ? Math.ceil(total / limit) : 0,
  };
};

/**
 * Admin: Get all scheduled payouts (for monitoring)
 */
const getAllScheduledPayouts = async (
  filters?: IPayoutFilters
): Promise<IPayoutHistory> => {
  const query: Record<string, unknown> = {
    status: 'scheduled',
    cancelled: false,
  };

  if (filters?.organizationId) {
    query.organization = new Types.ObjectId(filters.organizationId);
  }

  const page = filters?.page && filters.page > 0 ? filters.page : 1;
  const limit =
    filters?.limit && filters.limit > 0 && filters.limit <= 100
      ? filters.limit
      : 20;
  const skip = (page - 1) * limit;

  const [payouts, total] = await Promise.all([
    Payout.find(query)
      .sort({ scheduledDate: 1 })
      .skip(skip)
      .limit(limit)
      .populate('organization', 'name')
      .populate('requestedBy', 'email'),
    Payout.countDocuments(query),
  ]);

  return {
    payouts,
    total,
    page,
    limit,
    totalPages: total > 0 ? Math.ceil(total / limit) : 0,
  };
};

export const PayoutService = {
  getAvailableDonationsForPayout,
  requestPayout,
  executePayout,
  cancelPayout,
  getPayoutDonations,
  getPayoutSummary,
  getPayoutHistory,
  getAllScheduledPayouts,
};
