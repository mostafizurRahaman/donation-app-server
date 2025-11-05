import httpStatus from 'http-status';
import { Types } from 'mongoose';
import { AppError } from '../../utils';
import {
  RoundUpDonation,
  MonthlyRoundUpBatch,
  UserRoundUpSettings,
  BasiqCDRConsent,
} from './roundUp.model';
import {
  IUserRoundUpSettings,
  IRoundUpDonation,
  IMonthlyRoundUpBatch,
  IBasiqCDRConsent,
  IBasiqConsentPayload,
  IMonthlyTransferPayload,
} from './roundUp.interface';
import {
  getAccountTransactions,
  calculateRoundUp,
  filterEligibleTransactions,
  validateConsentStatus,
  revokeConsent as revokeBasiqConsent,
  getConsentUrl,
} from './basiq.utils';

// Enable round-up donations
const enableRoundUp = async (
  userId: string,
  charityId: string,
  monthlyLimit: number
): Promise<IUserRoundUpSettings> => {
  try {
    // Check if settings already exist
    let settings = await UserRoundUpSettings.findOne({ userId: new Types.ObjectId(userId) });
    
    if (settings) {
      // Update existing settings
      settings.isEnabled = true;
      settings.selectedCharityId = new Types.ObjectId(charityId);
      settings.monthlyLimit = monthlyLimit;
      await settings.save();
    } else {
      // Create new settings
      settings = await UserRoundUpSettings.create({
        userId: new Types.ObjectId(userId),
        isEnabled: true,
        selectedCharityId: new Types.ObjectId(charityId),
        monthlyLimit,
        currentMonthTotal: 0,
      });
    }
    
    return settings;
  } catch (error) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Failed to enable round-up: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

// Update round-up settings
const updateRoundUpSettings = async (
  userId: string,
  updates: Partial<{
    isEnabled: boolean;
    monthlyLimit: number;
    charityId: string;
  }>
): Promise<IUserRoundUpSettings> => {
  try {
    const settings = await UserRoundUpSettings.findOne({ userId: new Types.ObjectId(userId) });
    
    if (!settings) {
      throw new AppError(httpStatus.NOT_FOUND, 'Round-up settings not found');
    }
    
    if (updates.isEnabled !== undefined) {
      settings.isEnabled = updates.isEnabled;
    }
    
    if (updates.monthlyLimit !== undefined) {
      settings.monthlyLimit = updates.monthlyLimit;
    }
    
    if (updates.charityId) {
      settings.selectedCharityId = new Types.ObjectId(updates.charityId);
    }
    
    await settings.save();
    return settings;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Failed to update round-up settings: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

// Store Basiq CDR consent
const storeBasiqConsent = async (payload: IBasiqConsentPayload): Promise<IBasiqCDRConsent> => {
  try {
    // Revoke any existing active consents for this user
    await BasiqCDRConsent.updateMany(
      { userId: new Types.ObjectId(payload.userId), status: 'active' },
      { status: 'revoked', revokedAt: new Date() }
    );
    
    // Create new consent record
    const consent = await BasiqCDRConsent.create({
      userId: new Types.ObjectId(payload.userId),
      consentId: payload.consentId,
      bankName: payload.bankName,
      accountIds: payload.accountIds,
      consentDate: new Date(),
      expiryDate: payload.expiryDate,
      status: 'active',
    });
    
    // Update user settings with consent info
    await UserRoundUpSettings.findOneAndUpdate(
      { userId: new Types.ObjectId(payload.userId) },
      {
        basiqConsentId: payload.consentId,
        consentExpiryDate: payload.expiryDate,
        bankAccountId: payload.accountIds[0], // Use first account
      }
    );
    
    return consent;
  } catch (error) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Failed to store consent: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

// Revoke CDR consent
const revokeConsent = async (userId: string, consentId: string): Promise<void> => {
  try {
    // Update consent status in database
    const consent = await BasiqCDRConsent.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), consentId },
      { status: 'revoked', revokedAt: new Date() }
    );
    
    if (!consent) {
      throw new AppError(httpStatus.NOT_FOUND, 'Consent not found');
    }
    
    // Revoke consent with Basiq
    await revokeBasiqConsent(userId, consentId);
    
    // Disable round-up for user
    await UserRoundUpSettings.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      {
        isEnabled: false,
        basiqConsentId: undefined,
        consentExpiryDate: undefined,
        bankAccountId: undefined,
      }
    );
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Failed to revoke consent: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

// Process transactions for round-up
const processTransactions = async (userId: string): Promise<IRoundUpDonation[]> => {
  try {
    const settings = await UserRoundUpSettings.findOne({ userId: new Types.ObjectId(userId) });
    
    if (!settings || !settings.isEnabled || !settings.bankAccountId || !settings.selectedCharityId) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Round-up not properly configured');
    }
    
    // Check if consent is still valid
    if (settings.basiqConsentId) {
      const isValid = await validateConsentStatus(userId, settings.basiqConsentId);
      if (!isValid) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'Bank consent has expired or been revoked');
      }
    }
    
    // Get transactions from last sync date or last 30 days
    const fromDate = settings.lastSyncDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = new Date();
    
    const transactions = await getAccountTransactions(
      userId,
      settings.bankAccountId,
      fromDate,
      toDate
    );
    
    const eligibleTransactions = filterEligibleTransactions(transactions);
    const processedRoundUps: IRoundUpDonation[] = [];
    
    for (const transaction of eligibleTransactions) {
      // Check if transaction already processed
      const existing = await RoundUpDonation.findOne({ transactionId: transaction.id });
      if (existing) continue;
      
      const amount = parseFloat(transaction.amount);
      const roundUpResult = calculateRoundUp(amount);
      
      if (!roundUpResult.shouldProcess) continue;
      
      // Check monthly limit
      if (settings.currentMonthTotal + roundUpResult.roundUpAmount > settings.monthlyLimit) {
        break; // Stop processing if limit would be exceeded
      }
      
      // Create round-up donation record
      const roundUpDonation = await RoundUpDonation.create({
        userId: new Types.ObjectId(userId),
        charityId: settings.selectedCharityId,
        bankAccountId: settings.bankAccountId,
        transactionId: transaction.id,
        originalAmount: roundUpResult.originalAmount,
        roundUpAmount: roundUpResult.roundUpAmount,
        transactionDate: new Date(transaction.transactionDate),
        merchantName: transaction.description,
        isProcessed: false,
      });
      
      processedRoundUps.push(roundUpDonation);
      
      // Update current month total
      settings.currentMonthTotal += roundUpResult.roundUpAmount;
    }
    
    // Update last sync date
    settings.lastSyncDate = toDate;
    await settings.save();
    
    return processedRoundUps;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Failed to process transactions: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

// Create monthly batch and transfer
const createMonthlyBatch = async (payload: IMonthlyTransferPayload): Promise<IMonthlyRoundUpBatch> => {
  try {
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    
    // Get unprocessed round-ups for the user and charity
    const roundUps = await RoundUpDonation.find({
      userId: new Types.ObjectId(payload.userId),
      charityId: new Types.ObjectId(payload.charityId),
      isProcessed: false,
    });
    
    if (roundUps.length === 0) {
      throw new AppError(httpStatus.BAD_REQUEST, 'No unprocessed round-ups found');
    }
    
    const totalAmount = roundUps.reduce((sum, roundUp) => sum + roundUp.roundUpAmount, 0);
    
    // Create monthly batch
    const batch = await MonthlyRoundUpBatch.create({
      userId: new Types.ObjectId(payload.userId),
      charityId: new Types.ObjectId(payload.charityId),
      month,
      year,
      totalAmount,
      transactionCount: roundUps.length,
      roundUpDonations: roundUps.map(ru => ru._id),
      isTransferred: false,
    });
    
    // Mark round-ups as processed
    await RoundUpDonation.updateMany(
      { _id: { $in: roundUps.map(ru => ru._id) } },
      { isProcessed: true, processedAt: new Date(), monthlyBatch: batch._id }
    );
    
    return batch;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Failed to create monthly batch: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

// Get user round-up history
const getRoundUpHistory = async (
  userId: string,
  options: {
    page: number;
    limit: number;
    startDate?: Date;
    endDate?: Date;
    charityId?: string;
  }
) => {
  const { page, limit, startDate, endDate, charityId } = options;
  const skip = (page - 1) * limit;
  
  const filter: Record<string, unknown> = { userId: new Types.ObjectId(userId) };
  
  if (startDate || endDate) {
    filter.transactionDate = {};
    if (startDate) (filter.transactionDate as Record<string, unknown>).$gte = startDate;
    if (endDate) (filter.transactionDate as Record<string, unknown>).$lte = endDate;
  }
  
  if (charityId) {
    filter.charityId = new Types.ObjectId(charityId);
  }
  
  const [roundUps, totalCount] = await Promise.all([
    RoundUpDonation.find(filter)
      .sort({ transactionDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate('charityId', 'name')
      .lean(),
    RoundUpDonation.countDocuments(filter),
  ]);
  
  return {
    roundUps,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
  };
};

// Get monthly summary
const getMonthlySummary = async (userId: string, month?: number, year?: number) => {
  const currentDate = new Date();
  const targetMonth = month || currentDate.getMonth() + 1;
  const targetYear = year || currentDate.getFullYear();
  
  const startDate = new Date(targetYear, targetMonth - 1, 1);
  const endDate = new Date(targetYear, targetMonth, 0);
  
  const [roundUps, batches, settings] = await Promise.all([
    RoundUpDonation.find({
      userId: new Types.ObjectId(userId),
      transactionDate: { $gte: startDate, $lte: endDate },
    }).populate('charityId', 'name'),
    MonthlyRoundUpBatch.find({
      userId: new Types.ObjectId(userId),
      month: targetMonth,
      year: targetYear,
    }).populate('charityId', 'name'),
    UserRoundUpSettings.findOne({ userId: new Types.ObjectId(userId) }),
  ]);
  
  const totalRoundUp = roundUps.reduce((sum, ru) => sum + ru.roundUpAmount, 0);
  const totalTransferred = batches.reduce((sum, batch) => sum + batch.totalAmount, 0);
  
  return {
    month: targetMonth,
    year: targetYear,
    totalRoundUp,
    totalTransferred,
    transactionCount: roundUps.length,
    monthlyLimit: settings?.monthlyLimit || 0,
    currentMonthTotal: settings?.currentMonthTotal || 0,
    roundUps,
    batches,
  };
};

// Get user settings
const getUserSettings = async (userId: string): Promise<IUserRoundUpSettings | null> => {
  return await UserRoundUpSettings.findOne({ userId: new Types.ObjectId(userId) })
    .populate('selectedCharityId', 'name');
};

// Get consent URL for user
const getConsentUrlForUser = async (userId: string): Promise<string> => {
  const redirectUri = `${process.env.CLIENT_URL}/round-up/consent-callback`;
  return await getConsentUrl(userId, redirectUri);
};

export const RoundUpService = {
  enableRoundUp,
  updateRoundUpSettings,
  storeBasiqConsent,
  revokeConsent,
  processTransactions,
  createMonthlyBatch,
  getRoundUpHistory,
  getMonthlySummary,
  getUserSettings,
  getConsentUrlForUser,
};
