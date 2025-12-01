// src/app/modules/Payout/payout.controller.ts

import httpStatus from 'http-status';
import { Response } from 'express';
import { asyncHandler, sendResponse, AppError } from '../../utils';
import { ExtendedRequest } from '../../types';
import { PayoutService } from './payout.service';
import Organization from '../Organization/organization.model';
import { ROLE } from '../Auth/auth.constant';

// 1. Organization: Request payout
const requestPayoutForOrganization = asyncHandler(
  async (req: ExtendedRequest, res: Response) => {
    const userId = req.user?._id.toString();
    const userRole = req.user?.role;

    if (!userId) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'User not authenticated');
    }

    if (userRole !== ROLE.ORGANIZATION) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'Only organizations can request payouts'
      );
    }

    const organization = await Organization.findOne({ auth: userId });
    if (!organization) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        'Organization profile not found'
      );
    }

    const payload = req.body;

    const payout = await PayoutService.requestPayout(
      organization._id.toString(),
      userId,
      payload
    );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      message: 'Payout requested successfully',
      data: payout,
    });
  }
);

// 2. Organization: Get payout summary (dashboard)
const getPayoutSummaryForOrganization = asyncHandler(
  async (req: ExtendedRequest, res: Response) => {
    const userId = req.user?._id.toString();
    const userRole = req.user?.role;

    if (!userId) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'User not authenticated');
    }

    if (userRole !== ROLE.ORGANIZATION) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'Only organizations can view payout summary'
      );
    }

    const organization = await Organization.findOne({ auth: userId });
    if (!organization) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        'Organization profile not found'
      );
    }

    const summary = await PayoutService.getPayoutSummary(
      organization._id.toString()
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: 'Payout summary retrieved successfully',
      data: summary,
    });
  }
);

// 3. Organization: Get payout history
const getPayoutHistoryForOrganization = asyncHandler(
  async (req: ExtendedRequest, res: Response) => {
    const userId = req.user?._id.toString();
    const userRole = req.user?.role;

    if (!userId) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'User not authenticated');
    }

    if (userRole !== ROLE.ORGANIZATION) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'Only organizations can view payout history'
      );
    }

    const organization = await Organization.findOne({ auth: userId });
    if (!organization) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        'Organization profile not found'
      );
    }

    const filters = req.query;

    const history = await PayoutService.getPayoutHistory(
      organization._id.toString(),
      filters
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: 'Payout history retrieved successfully',
      data: history,
    });
  }
);

// 4. Organization/Admin: Get donations included in a specific payout
const getPayoutDonations = asyncHandler(
  async (req: ExtendedRequest, res: Response) => {
    const userId = req.user?._id.toString();
    const userRole = req.user?.role;
    const { id } = req.params; // payoutId

    if (!userId) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'User not authenticated');
    }

    const donationPayouts = await PayoutService.getPayoutDonations(id);

    // If organization, ensure they own this payout
    if (userRole === ROLE.ORGANIZATION && donationPayouts.length > 0) {
      const org = await Organization.findOne({ auth: userId });
      if (!org) {
        throw new AppError(
          httpStatus.NOT_FOUND,
          'Organization profile not found'
        );
      }

      const payoutOrgId = donationPayouts[0].organization.toString();
      if (payoutOrgId !== org._id.toString()) {
        throw new AppError(
          httpStatus.FORBIDDEN,
          'Access denied to this payout'
        );
      }
    }

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: 'Payout donations retrieved successfully',
      data: donationPayouts,
    });
  }
);

// 5. Admin: Get all scheduled payouts (for monitoring)
const getAllScheduledPayouts = asyncHandler(
  async (req: ExtendedRequest, res: Response) => {
    const userRole = req.user?.role;

    if (userRole !== ROLE.ADMIN) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'Only admins can view all scheduled payouts'
      );
    }

    const filters = req.query;

    const result = await PayoutService.getAllScheduledPayouts(filters);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: 'Scheduled payouts retrieved successfully',
      data: result,
    });
  }
);

// 6. Admin: Execute payout early (manual trigger)
const executePayout = asyncHandler(
  async (req: ExtendedRequest, res: Response) => {
    const userId = req.user?._id.toString();
    const userRole = req.user?.role;
    const { id } = req.params; // payoutId

    if (!userId) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'User not authenticated');
    }

    if (userRole !== ROLE.ADMIN) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'Only admins can execute payouts'
      );
    }

    const result = await PayoutService.executePayout(id, userId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: 'Payout executed successfully',
      data: result,
    });
  }
);

// 7. Admin: Cancel payout
const cancelPayout = asyncHandler(
  async (req: ExtendedRequest, res: Response) => {
    const userId = req.user?._id.toString();
    const userRole = req.user?.role;
    const { id } = req.params; // payoutId
    const { reason } = req.body;

    if (!userId) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'User not authenticated');
    }

    if (userRole !== ROLE.ADMIN) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'Only admins can cancel payouts'
      );
    }

    const result = await PayoutService.cancelPayout(id, userId, reason);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: 'Payout cancelled successfully',
      data: result,
    });
  }
);

export const PayoutController = {
  requestPayoutForOrganization,
  getPayoutSummaryForOrganization,
  getPayoutHistoryForOrganization,
  getPayoutDonations,
  getAllScheduledPayouts,
  executePayout,
  cancelPayout,
};
