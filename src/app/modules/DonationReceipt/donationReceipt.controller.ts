import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { asyncHandler, sendResponse } from '../../utils';
import { DonationReceiptService } from './donationReceipt.service';

// Generate receipt
const generateReceipt = asyncHandler(async (req: Request, res: Response) => {
  const result = await DonationReceiptService.generateReceipt(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Receipt generated successfully!',
    data: result,
  });
});

// Get receipts by donor
const getReceiptsByDonor = asyncHandler(async (req: Request, res: Response) => {
  const { donorId } = req.params;
  const { page = 1, limit = 10, startDate, endDate } = req.query;

  const result = await DonationReceiptService.getReceiptsByDonor(donorId, {
    page: Number(page),
    limit: Number(limit),
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Receipts retrieved successfully!',
    data: result,
  });
});

// Get receipts by organization
const getReceiptsByOrganization = asyncHandler(
  async (req: Request, res: Response) => {
    const { organizationId } = req.params;
    const { page = 1, limit = 10, startDate, endDate } = req.query;

    const result = await DonationReceiptService.getReceiptsByOrganization(
      organizationId,
      {
        page: Number(page),
        limit: Number(limit),
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      }
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: 'Organization receipts retrieved successfully!',
      data: result,
    });
  }
);

// Get receipt by ID
const getReceiptById = asyncHandler(async (req: Request, res: Response) => {
  const { receiptId } = req.params;
  const result = await DonationReceiptService.getReceiptById(receiptId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Receipt retrieved successfully!',
    data: result,
  });
});

// Resend receipt email
const resendReceiptEmail = asyncHandler(async (req: Request, res: Response) => {
  const { receiptId } = req.params;
  const { donorEmail } = req.body;

  // Get receipt details
  const receipt = await DonationReceiptService.getReceiptById(receiptId);

  await DonationReceiptService.sendReceiptEmailService({
    receiptId,
    donorEmail,
    donorName: receipt.donorName,
    organizationName: receipt.organizationName,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Receipt email sent successfully!',
    data: null,
  });
});

// Download receipt
const downloadReceipt = asyncHandler(async (req: Request, res: Response) => {
  const { receiptId } = req.params;
  const receipt = await DonationReceiptService.getReceiptById(receiptId);

  // In a real implementation, you would serve the actual file
  // For now, redirect to the receipt URL
  res.redirect(receipt.receiptUrl);
});

// Admin: Get all receipts
const adminGetAllReceipts = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 10,
      startDate,
      endDate,
      organizationId,
      donorId,
      search,
    } = req.query;

    const result = await DonationReceiptService.adminGetAllReceipts({
      page: Number(page),
      limit: Number(limit),
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      organizationId: organizationId as string,
      donorId: donorId as string,
      search: search as string,
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: 'All receipts retrieved successfully!',
      data: result,
    });
  }
);

export const DonationReceiptController = {
  generateReceipt,
  getReceiptsByDonor,
  getReceiptsByOrganization,
  getReceiptById,
  resendReceiptEmail,
  downloadReceipt,
  adminGetAllReceipts,
};
