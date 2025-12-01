// src/app/modules/Payout/donationPayout.service.ts

import httpStatus from 'http-status';
import { Types } from 'mongoose';
import { AppError } from '../../utils';
import DonationPayout from './donationPayout.model';
import {
  IDonationPayout,
  IDonationPayoutDetails,
} from './donationPayout.interface';
import Donation from '../Donation/donation.model';
import Organization from '../Organization/organization.model';
import { ROLE } from '../Auth/auth.constant';
import { IAuth } from '../Auth/auth.interface';

/**
 * INTERNAL HELPERS
 * These operate on IDs only and don't know about user roles.
 */

/**
 * Check if a donation is already included in an active payout
 * Active statuses: 'scheduled', 'processing'
 */
const isDonationInActivePayout = async (
  donationId: string
): Promise<boolean> => {
  const existing = await DonationPayout.findOne({
    donation: new Types.ObjectId(donationId),
    status: { $in: ['scheduled', 'processing'] },
  }).lean();

  return !!existing;
};

/**
 * Ensure that a donation is NOT already in an active payout before including it
 * Throws AppError if it is.
 */
const assertDonationNotInActivePayout = async (donationId: string) => {
  const inActive = await isDonationInActivePayout(donationId);
  if (inActive) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Donation is already included in an active payout'
    );
  }
};

/**
 * Get payout status info for a specific donation (no role checks)
 */
const getDonationPayoutStatusRaw = async (
  donationId: string
): Promise<{
  isPaid: boolean;
  status: IDonationPayout['status'] | 'available';
  payoutId?: string;
  scheduledDate?: Date;
  paidAt?: Date;
  stripeTransferId?: string;
}> => {
  const dp = await DonationPayout.findOne({
    donation: new Types.ObjectId(donationId),
  })
    .populate('payout', 'status scheduledDate executedAt stripeTransferId')
    .sort({ createdAt: -1 })
    .lean();

  if (!dp) {
    return {
      isPaid: false,
      status: 'available',
    };
  }

  return {
    isPaid: dp.status === 'paid',
    status: dp.status,
    payoutId: dp.payout ? (dp.payout as any)._id.toString() : undefined,
    scheduledDate: dp.scheduledDate,
    paidAt: dp.paidAt,
    stripeTransferId: dp.stripeTransferId,
  };
};

/**
 * Get all DonationPayout records for a given payout (no role checks)
 */
const getByPayoutIdRaw = async (
  payoutId: string
): Promise<IDonationPayoutDetails[]> => {
  const records = await DonationPayout.find({
    payout: new Types.ObjectId(payoutId),
  })
    .populate({
      path: 'donation',
      populate: [
        { path: 'donor', select: 'name email image' },
        { path: 'cause', select: 'name category' },
      ],
    })
    .lean();

  return records as unknown as IDonationPayoutDetails[];
};

/**
 * Get all DonationPayout records for a donation (history, no role checks)
 */
const getByDonationIdRaw = async (
  donationId: string
): Promise<IDonationPayout[]> => {
  const records = await DonationPayout.find({
    donation: new Types.ObjectId(donationId),
  })
    .sort({ createdAt: -1 })
    .lean();

  return records as unknown as IDonationPayout[];
};

/**
 * Get paid donations for an organization with pagination (no role checks)
 */
const getPaidDonationsForOrganizationRaw = async (
  organizationId: string,
  options?: {
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }
) => {
  const { startDate, endDate } = options || {};
  const page = options?.page && options.page > 0 ? options.page : 1;
  const limit =
    options?.limit && options.limit > 0 && options.limit <= 100
      ? options.limit
      : 20;
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {
    organization: new Types.ObjectId(organizationId),
    status: 'paid',
  };

  if (startDate || endDate) {
    query.paidAt = {};
    if (startDate) (query.paidAt as any).$gte = startDate;
    if (endDate) (query.paidAt as any).$lte = endDate;
  }

  const [records, total] = await Promise.all([
    DonationPayout.find(query)
      .populate({
        path: 'donation',
        populate: [
          { path: 'donor', select: 'name email image' },
          { path: 'cause', select: 'name category' },
        ],
      })
      .populate('payout', 'stripeTransferId executedAt')
      .sort({ paidAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    DonationPayout.countDocuments(query),
  ]);

  return {
    data: records,
    total,
    page,
    limit,
    totalPages: total > 0 ? Math.ceil(total / limit) : 0,
  };
};

/**
 * PUBLIC SERVICE METHODS
 * These are role-aware and used by controllers.
 */

/**
 * Get donation payout status with role-based access control
 */
const getDonationPayoutStatusForUser = async (
  user: IAuth | null | undefined,
  donationId: string
) => {
  if (!user?._id) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  const donation = await Donation.findById(donationId).select(
    'organization donor'
  );

  if (!donation) {
    throw new AppError(httpStatus.NOT_FOUND, 'Donation not found');
  }

  // ADMIN: can view any donation payout status
  if (user.role === ROLE.ADMIN) {
    return getDonationPayoutStatusRaw(donationId);
  }

  // ORGANIZATION: can only view if donation belongs to their org
  if (user.role === ROLE.ORGANIZATION) {
    const org = await Organization.findOne({ auth: user._id });
    if (!org) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        'Organization profile not found'
      );
    }
    if (donation.organization?.toString() !== org._id.toString()) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'Access denied to this donation'
      );
    }
    return getDonationPayoutStatusRaw(donationId);
  }

  // Other roles not allowed
  throw new AppError(
    httpStatus.FORBIDDEN,
    'Only admins or owning organizations can view donation payout status'
  );
};

/**
 * Get all donation payouts for a payout, with role checks
 */
const getDonationPayoutsByPayoutForUser = async (
  user: IAuth | null | undefined,
  payoutId: string
) => {
  if (!user?._id) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  const records = await getByPayoutIdRaw(payoutId);

  if (records.length === 0) {
    return [];
  }

  // ADMIN: can view all
  if (user.role === ROLE.ADMIN) {
    return records;
  }

  // ORGANIZATION: can only view if payout belongs to their org
  if (user.role === ROLE.ORGANIZATION) {
    const org = await Organization.findOne({ auth: user._id });
    if (!org) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        'Organization profile not found'
      );
    }

    const payoutOrgId = records[0].organization.toString();
    if (payoutOrgId !== org._id.toString()) {
      throw new AppError(httpStatus.FORBIDDEN, 'Access denied to this payout');
    }
    return records;
  }

  throw new AppError(
    httpStatus.FORBIDDEN,
    'Only admins or owning organizations can view payout details'
  );
};

/**
 * Get paid donations for current context (org or admin)
 * - If ORGANIZATION: uses their own org
 * - If ADMIN: requires organizationId in filters
 */
const getPaidDonationsForUserContext = async (
  user: IAuth | null | undefined,
  filters: {
    organizationId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }
) => {
  if (!user?._id) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  let organizationId: string | undefined;

  if (user.role === ROLE.ORGANIZATION) {
    const org = await Organization.findOne({ auth: user._id });
    if (!org) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        'Organization profile not found'
      );
    }
    organizationId = org._id.toString();
  } else if (user.role === ROLE.ADMIN) {
    if (!filters.organizationId) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'organizationId is required for admin requests'
      );
    }
    organizationId = filters.organizationId;
  } else {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'Only organizations or admins can view paid donations'
    );
  }

  return getPaidDonationsForOrganizationRaw(organizationId, filters);
};

export const DonationPayoutService = {
  // low-level helpers
  isDonationInActivePayout,
  assertDonationNotInActivePayout,
  getDonationPayoutStatusRaw,
  getByPayoutIdRaw,
  getByDonationIdRaw,
  getPaidDonationsForOrganizationRaw,

  // role-aware public APIs
  getDonationPayoutStatusForUser,
  getDonationPayoutsByPayoutForUser,
  getPaidDonationsForUserContext,
};
