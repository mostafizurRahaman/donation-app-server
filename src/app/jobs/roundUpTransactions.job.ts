import cron from 'node-cron';
import mongoose from 'mongoose';
import {
  RoundUpModel,
  IRoundUpDocument,
} from '../modules/RoundUp/roundUp.model';
import { roundUpService } from '../modules/RoundUp/roundUp.service';
import { roundUpTransactionService } from '../modules/RoundUpTransaction/roundUpTransaction.service';
import { cronJobTracker } from './cronJobTracker';
import { StripeService } from '../modules/Stripe/stripe.service';
import { RoundUpTransactionModel } from '../modules/RoundUpTransaction/roundUpTransaction.model';
import Donation from '../modules/Donation/donation.model';
import { IAuth } from '../modules/Auth/auth.interface';
import Auth from '../modules/Auth/auth.model';

interface IPopulatedRoundUpConfig extends Omit<IRoundUpDocument, 'user'> {
  user: IAuth;
}

/**
 * RoundUp Transactions Cron Job
 *
 * This job automates the process of syncing bank transactions and processing round-up donations.
 * It runs on a schedule to ensure user donations are handled in a timely manner.
 *
 * Schedule: '0 *\/4 * * *' = Every 4 hours at minute 0 (e.g., 00:00, 04:00, 08:00)
 */

let isProcessing = false; // Prevents overlapping executions
const JOB_NAME = 'roundup-transactions-main';

/**
 * Triggers end-of-month donations for users who have an accumulated balance
 * but haven't met their threshold, or have "no-limit" set.
 * This should only run on the first day of a new month.
 *
 * ✅ MODIFIED: Now creates Donation record BEFORE payment intent (matches threshold flow)
 */
const processEndOfMonthDonations = async () => {
  // Find users with a balance from the previous month who are ready for donation
  const configsForDonation = await RoundUpModel.find<IPopulatedRoundUpConfig>({
    isActive: true,
    enabled: true,
    status: 'pending', // Ensure we don't re-process donations
    currentMonthTotal: { $gt: 0 }, // Must have a balance to donate
  }).populate('user');

  if (configsForDonation.length === 0) {
    return { processed: 0, success: 0, failed: 0 };
  }

  console.log(
    `🎯 Processing ${configsForDonation.length} month-end donation(s)...`
  );

  let successCount = 0;
  let failureCount = 0;

  for (const config of configsForDonation) {
    const userId = config.user._id.toString();
    if (!userId) {
      failureCount++;
      continue;
    }

    const session = await mongoose.startSession();

    try {
      const totalAmount = config.currentMonthTotal;
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const monthStr = String(lastMonth.getMonth() + 1).padStart(2, '0');
      const year = lastMonth.getFullYear();

      // Get all processed transactions for this round-up config for the month
      const monthTransactions = await RoundUpTransactionModel.find({
        roundUp: config._id,
        user: userId,
        status: 'processed',
        stripePaymentIntentId: { $in: [null, undefined] },
        transactionDate: {
          $gte: new Date(year, lastMonth.getMonth(), 1),
          $lt: new Date(year, lastMonth.getMonth() + 1, 1),
        },
      });

      if (monthTransactions.length === 0) {
        failureCount++;
        continue;
      }

      // ✅ Validate Auth exists (userId is Auth._id)
      const donorAuth = await Auth.findById(userId).session(session);
      if (!donorAuth || donorAuth.role !== 'CLIENT') {
        await session.abortTransaction();
        failureCount++;
        continue;
      }

      // STEP 1: Create Donation record with PENDING status
      const donation = await Donation.create({
        donor: userId, // userId is Auth._id
        organization: config.organization,
        cause: config.cause,
        donationType: 'round-up',
        amount: totalAmount,
        currency: 'USD',
        status: 'pending', // ⭐ Start with PENDING
        donationDate: new Date(),
        specialMessage:
          config.specialMessage ||
          `Automatic monthly round-up for ${monthStr}/${year}`,
        pointsEarned: Math.round(totalAmount * 100),
        roundUpId: config._id,
        roundUpTransactionIds: monthTransactions.map((t) => t._id),
        receiptGenerated: false,
        metadata: {
          userId: String(userId),
          roundUpId: String(config._id),
          month: `${year}-${monthStr}`,
          year: year.toString(),
          type: 'roundup_donation',
          isMonthEnd: true, // ⭐ Flag for month-end donation
          transactionCount: monthTransactions.length,
        },
      });

      // STEP 2: Create Stripe PaymentIntent
      const paymentResult = await StripeService.createRoundUpPaymentIntent({
        roundUpId: String(config._id),
        userId: String(userId),
        charityId: String(config.organization),
        causeId: String(config.cause),
        amount: totalAmount,
        month: `${year}-${monthStr}`,
        year: year,
        specialMessage: `Automatic monthly round-up for ${monthStr}/${year}`,
        donationId: String(donation._id), // ⭐ Include donationId
      });

      // STEP 3: Update Donation to PROCESSING
      const donationDoc = donation.toObject();
      await Donation.findByIdAndUpdate(donation._id, {
        status: 'processing',
        stripePaymentIntentId: paymentResult.payment_intent_id,
        metadata: {
          ...(donationDoc.metadata || {}),
          paymentInitiatedAt: new Date(),
        },
      });

      // STEP 4: Update RoundUp config
      config.status = 'processing';
      config.lastDonationAttempt = new Date();
      config.currentMonthTotal = 0; // Reset balance for the new month
      config.lastMonthReset = new Date();
      await config.save();

      // STEP 5: Update transactions
      await RoundUpTransactionModel.updateMany(
        {
          roundUp: config._id,
          _id: { $in: monthTransactions.map((t) => t._id) },
        },
        {
          stripePaymentIntentId: paymentResult.payment_intent_id,
          donation: donation._id,
          donationAttemptedAt: new Date(),
        }
      );

      console.log(
        `   ✅ Month-end donation: $${totalAmount} for user ${userId} (${monthStr}/${year})`
      );
      successCount++;
    } catch (error) {
      await session.abortTransaction();
      failureCount++;
      console.error(
        `❌ Month-end donation failed for user ${userId}:`,
        error instanceof Error ? error.message : error
      );
      await config.markAsFailed('Month-end donation trigger failed');
    } finally {
      await session.endSession();
    }
  }

  return {
    processed: configsForDonation.length,
    success: successCount,
    failed: failureCount,
  };
};

// corn
export const startRoundUpProcessingCron = () => {
  const schedule = '0 */4 * * *'; // Every 4 hours

  cronJobTracker.registerJob(JOB_NAME, schedule);
  cronJobTracker.setJobStatus(JOB_NAME, true);

  console.log(`🔄 RoundUp Transactions Cron Job initialized (${schedule})`);

  const job = cron.schedule(schedule, async () => {
    if (isProcessing) {
      console.log(
        '⏭️ Skipping RoundUp processing: previous run still in progress.'
      );
      return;
    }

    isProcessing = true;
    const startTime = Date.now();
    cronJobTracker.startExecution(JOB_NAME);

    console.log(
      `\n🔄 RoundUp Processing Started - ${new Date().toLocaleString()}`
    );

    try {
      // Step 1: Handle End-of-Month donations if it's the first day of the month
      const today = new Date();
      if (today.getDate() === 1) {
        const donationResults = await processEndOfMonthDonations();
        if (donationResults.processed > 0) {
          console.log(
            `📊 Month-End: ${donationResults.success}/${donationResults.processed} successful, ${donationResults.failed} failed`
          );
        }
      }

      // Step 2: Perform regular transaction sync for all active users
      const activeRoundUpConfigs =
        await RoundUpModel.find<IPopulatedRoundUpConfig>({
          isActive: true,
          enabled: true,
          bankConnection: { $ne: null },
        }).populate('user');

      if (activeRoundUpConfigs.length === 0) {
        isProcessing = false;
        cronJobTracker.completeExecution(JOB_NAME, {
          totalProcessed: 0,
          successCount: 0,
          failureCount: 0,
        });
        return;
      }

      console.log(
        `📊 Syncing ${activeRoundUpConfigs.length} active round-up(s)...`
      );

      let successCount = 0;
      let failureCount = 0;

      for (const config of activeRoundUpConfigs) {
        // We check the status again in case the month-end job just processed this user
        if (config.status === 'processing') {
          continue;
        }

        const userId = config.user._id.toString();
        const bankConnectionId = config.bankConnection.toString();

        if (!userId || !bankConnectionId) {
          failureCount++;
          continue;
        }

        try {
          // A. Sync new transactions from Plaid
          const syncResult = await roundUpService.syncTransactions(
            String(userId),
            String(bankConnectionId),
            {}
          );

          const newTransactions = syncResult.data?.plaidSync?.added || [];

          if (newTransactions.length === 0) {
            successCount++;
            continue;
          }

          // B. Process newly synced transactions to create round-ups
          const processingResult =
            await roundUpTransactionService.processTransactionsFromPlaid(
              String(userId),
              String(bankConnectionId),
              newTransactions
            );

          // C. Check if a threshold was met and donation was triggered by the service
          if (processingResult.thresholdReached) {
            console.log(
              `   🎯 User ${userId}: Threshold met! $${processingResult.thresholdReached.amount} donation triggered`
            );
          } else if (processingResult.processed > 0) {
            console.log(
              `   ✓ User ${userId}: ${processingResult.processed} round-up(s) processed, ${newTransactions.length} transaction(s) synced`
            );
          }

          successCount++;
        } catch (error) {
          failureCount++;
          console.error(
            `❌ User ${userId} sync failed:`,
            error instanceof Error ? error.message : error
          );
        }
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(
        `\n📊 Summary: ${successCount}/${activeRoundUpConfigs.length} successful, ${failureCount} failed (${duration}s)`
      );

      cronJobTracker.completeExecution(JOB_NAME, {
        totalProcessed: activeRoundUpConfigs.length,
        successCount,
        failureCount,
      });
    } catch (error: unknown) {
      console.error('❌ Critical error in RoundUp processing cron job:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      cronJobTracker.failExecution(JOB_NAME, errorMessage);
    } finally {
      isProcessing = false;
    }
  });

  job.start();
  console.log('✅ RoundUp Transactions Cron Job started successfully.\n');
  return job;
};

// Manual trigger function for testing
export const manualTriggerRoundUpProcessing = async (): Promise<{
  success: boolean;
  data?: Record<string, unknown>;
}> => {
  if (isProcessing) {
    console.log(
      '⏭️ Skipping RoundUp processing: previous run still in progress.'
    );
    return {
      success: false,
      data: { message: 'Processing already in progress' },
    };
  }

  isProcessing = true;
  const startTime = Date.now();
  cronJobTracker.startExecution(JOB_NAME);

  console.log(
    `\n🔄 RoundUp Processing Started (Manual) - ${new Date().toLocaleString()}`
  );

  try {
    // Step 1: Handle End-of-Month donations if it's the first day of the month
    const today = new Date();
    if (today.getDate() === 1) {
      const donationResults = await processEndOfMonthDonations();
      if (donationResults.processed > 0) {
        console.log(
          `📊 Month-End: ${donationResults.success}/${donationResults.processed} successful, ${donationResults.failed} failed`
        );
      }
    }

    // Step 2: Perform regular transaction sync for all active users
    const activeRoundUpConfigs =
      await RoundUpModel.find<IPopulatedRoundUpConfig>({
        isActive: true,
        enabled: true,
        bankConnection: { $ne: null },
      }).populate('user');

    if (activeRoundUpConfigs.length === 0) {
      isProcessing = false;
      cronJobTracker.completeExecution(JOB_NAME, {
        totalProcessed: 0,
        successCount: 0,
        failureCount: 0,
      });
      return {
        success: true,
        data: { message: 'No active round-ups to sync' },
      };
    }

    console.log(
      `📊 Syncing ${activeRoundUpConfigs.length} active round-up(s)...`
    );

    let successCount = 0;
    let failureCount = 0;

    for (const config of activeRoundUpConfigs) {
      // We check the status again in case the month-end job just processed this user
      if (config.status === 'processing') {
        continue;
      }

      const userId = config.user._id.toString();
      const bankConnectionId = config.bankConnection.toString();

      if (!userId || !bankConnectionId) {
        failureCount++;
        continue;
      }

      try {
        // A. Sync new transactions from Plaid
        const syncResult = await roundUpService.syncTransactions(
          String(userId),
          String(bankConnectionId),
          {}
        );

        const newTransactions = syncResult.data?.plaidSync?.added || [];

        if (newTransactions.length === 0) {
          successCount++;
          continue;
        }

        // B. Process newly synced transactions to create round-ups
        const processingResult =
          await roundUpTransactionService.processTransactionsFromPlaid(
            String(userId),
            String(bankConnectionId),
            newTransactions
          );

        // C. Check if a threshold was met and donation was triggered by the service
        if (processingResult.thresholdReached) {
          console.log(
            `   🎯 User ${userId}: Threshold met! $${processingResult.thresholdReached.amount} donation triggered`
          );
        } else if (processingResult.processed > 0) {
          console.log(
            `   ✓ User ${userId}: ${processingResult.processed} round-up(s) processed, ${newTransactions.length} transaction(s) synced`
          );
        }

        successCount++;
      } catch (error) {
        failureCount++;
        console.error(
          `❌ User ${userId} sync failed:`,
          error instanceof Error ? error.message : error
        );
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(
      `\n📊 Summary: ${successCount}/${activeRoundUpConfigs.length} successful, ${failureCount} failed (${duration}s)`
    );

    cronJobTracker.completeExecution(JOB_NAME, {
      totalProcessed: activeRoundUpConfigs.length,
      successCount,
      failureCount,
    });

    return {
      success: true,
      data: {
        totalProcessed: activeRoundUpConfigs.length,
        successCount,
        failureCount,
      },
    };
  } catch (error: unknown) {
    console.error('❌ Critical error in RoundUp processing cron job:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    cronJobTracker.failExecution(JOB_NAME, errorMessage);
    return {
      success: false,
      data: { error: errorMessage },
    };
  } finally {
    isProcessing = false;
  }
};
