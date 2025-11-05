import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { asyncHandler, sendResponse } from '../../utils';
import { RoundUpService } from './roundUp.service';

// Enable round-up donations
const enableRoundUp = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id.toString();
  const { charityId, monthlyLimit } = req.body;

  const result = await RoundUpService.enableRoundUp(
    userId,
    charityId,
    monthlyLimit
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Round-up donations enabled successfully',
    data: result,
  });
});

// Update round-up settings
const updateRoundUpSettings = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id.toString();
    const updates = req.body;

    const result = await RoundUpService.updateRoundUpSettings(userId, updates);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: 'Round-up settings updated successfully',
      data: result,
    });
  }
);

// Get consent URL for Basiq CDR
const getConsentUrl = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id.toString();

  const consentUrl = await RoundUpService.getConsentUrlForUser(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Consent URL generated successfully',
    data: { consentUrl },
  });
});

// Store Basiq CDR consent
const storeConsent = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id.toString();
  const { consentId, bankName, accountIds, expiryDate } = req.body;

  const result = await RoundUpService.storeBasiqConsent({
    userId,
    consentId,
    bankName,
    accountIds,
    expiryDate,
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'CDR consent stored successfully',
    data: result,
  });
});

// Revoke CDR consent
const revokeConsent = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id.toString();
  const { consentId } = req.params;

  await RoundUpService.revokeConsent(userId, consentId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'CDR consent revoked successfully',
    data: null,
  });
});

// Sync transactions (manual trigger)
const syncTransactions = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id.toString();

  const result = await RoundUpService.processTransactions(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Transactions synced successfully',
    data: {
      processedCount: result.length,
      roundUps: result,
    },
  });
});

// Get round-up history
const getRoundUpHistory = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id.toString();
  const { page = 1, limit = 10, startDate, endDate, charityId } = req.query;

  const result = await RoundUpService.getRoundUpHistory(userId, {
    page: Number(page),
    limit: Number(limit),
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
    charityId: charityId as string,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Round-up history retrieved successfully',
    data: result,
  });
});

// Get monthly summary
const getMonthlySummary = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id.toString();
  const { month, year } = req.query;

  const result = await RoundUpService.getMonthlySummary(
    userId,
    month ? Number(month) : undefined,
    year ? Number(year) : undefined
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Monthly summary retrieved successfully',
    data: result,
  });
});

// Get user settings
const getUserSettings = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id.toString();

  const result = await RoundUpService.getUserSettings(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'User settings retrieved successfully',
    data: result,
  });
});

// Create monthly batch (internal/admin)
const createMonthlyBatch = asyncHandler(async (req: Request, res: Response) => {
  const { userId, charityId, totalAmount, transactionIds } = req.body;

  const result = await RoundUpService.createMonthlyBatch({
    userId,
    charityId,
    totalAmount,
    transactionIds,
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Monthly batch created successfully',
    data: result,
  });
});

export const RoundUpController = {
  enableRoundUp,
  updateRoundUpSettings,
  getConsentUrl,
  storeConsent,
  revokeConsent,
  syncTransactions,
  getRoundUpHistory,
  getMonthlySummary,
  getUserSettings,
  createMonthlyBatch,
};
