import httpStatus from 'http-status';
import { Types, FilterQuery } from 'mongoose';
import { AppError } from '../../utils';
import DonationReceipt from './donationReceipt.model';
import {
  IReceiptGenerationPayload,
  IReceiptEmailPayload,
  IDonationReceipt,
} from './donationReceipt.interface';
import { generateReceiptPDF } from './donationReceipt.utils';
import { sendReceiptEmail } from '../../utils/emailService';

// Generate donation receipt
const generateReceipt = async (
  payload: IReceiptGenerationPayload
): Promise<IDonationReceipt> => {
  try {
    // Check if receipt already exists for this donation
    const existingReceipt = await DonationReceipt.findOne({
      donationId: new Types.ObjectId(payload.donationId),
    });

    if (existingReceipt) {
      throw new AppError(
        httpStatus.CONFLICT,
        'Receipt already exists for this donation'
      );
    }

    // Generate PDF receipt
    const receiptUrl = await generateReceiptPDF({
      donorName: payload.donorName,
      organizationName: payload.organizationName,
      organizationABN: payload.organizationABN,
      organizationStatus: payload.organizationStatus,
      donationAmount: payload.donationAmount,
      donationDate: payload.donationDate,
      paymentMethod: payload.paymentMethod,
    });

    // Create receipt record
    const receiptData = {
      donationId: new Types.ObjectId(payload.donationId),
      donorId: new Types.ObjectId(payload.donorId),
      organizationId: new Types.ObjectId(payload.organizationId),
      donationAmount: payload.donationAmount,
      donationDate: payload.donationDate,
      donorName: payload.donorName,
      organizationName: payload.organizationName,
      organizationABN: payload.organizationABN,
      organizationStatus: payload.organizationStatus,
      paymentMethod: payload.paymentMethod,
      receiptUrl,
    };

    const receipt = await DonationReceipt.create(receiptData);
    return receipt;
  } catch (error) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Failed to generate receipt: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
};

// Send receipt email
const sendReceiptEmailService = async (
  payload: IReceiptEmailPayload
): Promise<void> => {
  try {
    const receipt = await DonationReceipt.findById(payload.receiptId);

    if (!receipt) {
      throw new AppError(httpStatus.NOT_FOUND, 'Receipt not found');
    }

    await sendReceiptEmail({
      to: payload.donorEmail,
      donorName: payload.donorName,
      organizationName: payload.organizationName,
      receiptUrl: receipt.receiptUrl,
      receiptNumber: receipt.receiptNumber,
      donationAmount: receipt.donationAmount,
      donationDate: receipt.donationDate,
    });

    // Update receipt record
    await DonationReceipt.findByIdAndUpdate(payload.receiptId, {
      isEmailSent: true,
      emailSentAt: new Date(),
    });
  } catch (error) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Failed to send receipt email: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
};

// Get receipts by donor
const getReceiptsByDonor = async (
  donorId: string,
  options: {
    page: number;
    limit: number;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<{
  receipts: IDonationReceipt[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}> => {
  const { page, limit, startDate, endDate } = options;
  const skip = (page - 1) * limit;

  // Build filter
  const filter: FilterQuery<
    Pick<IDonationReceipt, 'donorId' | 'donationDate'>
  > = {
    donorId: new Types.ObjectId(donorId),
  };

  if (startDate || endDate) {
    const dateCondition: { $gte?: Date; $lte?: Date } = {};
    if (startDate) dateCondition.$gte = startDate;
    if (endDate) dateCondition.$lte = endDate;
    filter.donationDate = dateCondition;
  }

  const [receipts, totalCount] = await Promise.all([
    DonationReceipt.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('organizationId', 'name')
      .lean(),
    DonationReceipt.countDocuments(filter),
  ]);

  return {
    receipts: receipts as unknown as IDonationReceipt[],
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
  };
};

// Get receipts by organization
const getReceiptsByOrganization = async (
  organizationId: string,
  options: {
    page: number;
    limit: number;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<{
  receipts: IDonationReceipt[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}> => {
  const { page, limit, startDate, endDate } = options;
  const skip = (page - 1) * limit;

  // Build filter
  const filter: FilterQuery<IDonationReceipt> = {
    organizationId: new Types.ObjectId(organizationId),
  };

  if (startDate || endDate) {
    const dateCondition: { $gte?: Date; $lte?: Date } = {};
    if (startDate) dateCondition.$gte = startDate;
    if (endDate) dateCondition.$lte = endDate;
    filter.donationDate = dateCondition;
  }

  const [receipts, totalCount] = await Promise.all([
    DonationReceipt.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('donorId', 'email')
      .lean(),
    DonationReceipt.countDocuments(filter),
  ]);

  return {
    receipts: receipts as unknown as IDonationReceipt[],
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
  };
};

// Get receipt by ID
const getReceiptById = async (receiptId: string): Promise<IDonationReceipt> => {
  const receipt = await DonationReceipt.findById(receiptId)
    .populate('donorId', 'email name')
    .populate('organizationId', 'name');

  if (!receipt) {
    throw new AppError(httpStatus.NOT_FOUND, 'Receipt not found');
  }

  return receipt;
};

// Admin: Get all receipts with filters
const adminGetAllReceipts = async (options: {
  page: number;
  limit: number;
  startDate?: Date;
  endDate?: Date;
  organizationId?: string;
  donorId?: string;
  search?: string;
}): Promise<{
  receipts: IDonationReceipt[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}> => {
  const { page, limit, startDate, endDate, organizationId, donorId, search } =
    options;
  const skip = (page - 1) * limit;

  // Build filter
  const filter: FilterQuery<IDonationReceipt> = {};

  if (startDate || endDate) {
    const dateCondition: { $gte?: Date; $lte?: Date } = {};
    if (startDate) dateCondition.$gte = startDate;
    if (endDate) dateCondition.$lte = endDate;
    filter.donationDate = dateCondition;
  }

  if (organizationId) {
    filter.organizationId = new Types.ObjectId(organizationId);
  }

  if (donorId) {
    filter.donorId = new Types.ObjectId(donorId);
  }

  if (search) {
    filter.$or = [
      { receiptNumber: { $regex: search, $options: 'i' } },
      { donorName: { $regex: search, $options: 'i' } },
      { organizationName: { $regex: search, $options: 'i' } },
    ] as unknown as FilterQuery<IDonationReceipt>[];
  }

  const [receipts, totalCount] = await Promise.all([
    DonationReceipt.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('donorId', 'email name')
      .populate('organizationId', 'name')
      .lean(),
    DonationReceipt.countDocuments(filter),
  ]);

  return {
    receipts: receipts as unknown as IDonationReceipt[],
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
  };
};

export const DonationReceiptService = {
  generateReceipt,
  sendReceiptEmailService,
  getReceiptsByDonor,
  getReceiptsByOrganization,
  getReceiptById,
  adminGetAllReceipts,
};
