import httpStatus from 'http-status';
import { Response } from 'express';
import { asyncHandler, sendResponse } from '../../utils';
import { ExtendedRequest } from '../../types';
import { DonationPayoutService } from './donationPayout.service';

// 1. Get payout status for a specific donation
const getDonationPayoutStatus = asyncHandler(
  async (req: ExtendedRequest, res: Response) => {
    const user = req.user;
    const { donationId } = req.params;

    const status = await DonationPayoutService.getDonationPayoutStatusForUser(
      user,
      donationId
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: 'Donation payout status retrieved successfully',
      data: status,
    });
  }
);

// 2. Get all donation payouts for a specific payout
const getDonationPayoutsByPayout = asyncHandler(
  async (req: ExtendedRequest, res: Response) => {
    const user = req.user;
    const { payoutId } = req.params;

    const records =
      await DonationPayoutService.getDonationPayoutsByPayoutForUser(
        user,
        payoutId
      );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: 'Donation payouts for this payout retrieved successfully',
      data: records,
    });
  }
);

// 3. Get paid donations for current organization (or specified org for admin)
const getPaidDonationsForCurrentOrganization = asyncHandler(
  async (req: ExtendedRequest, res: Response) => {
    const user = req.user;

    const { startDate, endDate, page, limit, organizationId } = req.query as {
      startDate?: string;
      endDate?: string;
      page?: string;
      limit?: string;
      organizationId?: string;
    };

    const result = await DonationPayoutService.getPaidDonationsForUserContext(
      user,
      {
        organizationId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      }
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: 'Paid donations retrieved successfully',
      data: result.data,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPage: result.totalPages,
      },
    });
  }
);

export const DonationPayoutController = {
  getDonationPayoutStatus,
  getDonationPayoutsByPayout,
  getPaidDonationsForCurrentOrganization,
};
