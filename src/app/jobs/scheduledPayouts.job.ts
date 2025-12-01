import cron from 'node-cron';
import { PayoutService } from '../modules/payout/payout.service';
import { cronJobTracker } from './cronJobTracker';
import Payout from '../modules/payout/payout.model';

/**
 * Scheduled Payouts Execution Cron Job
 *
 * Automatically executes payouts that have reached their scheduled date
 * Runs every hour to check for due payouts
 *
 * Schedule: '0 * * * *' = Every hour at minute 0
 */

let isProcessing = false;
const JOB_NAME = 'scheduled-payouts-execution';

export const startScheduledPayoutsCron = () => {
  const schedule = '0 * * * *'; // Every hour

  cronJobTracker.registerJob(JOB_NAME, schedule);
  cronJobTracker.setJobStatus(JOB_NAME, true);

  console.log('💰 Scheduled Payouts Execution Cron Job initialized');
  console.log(`   Schedule: ${schedule} (Every hour)`);

  const job = cron.schedule(schedule, async () => {
    if (isProcessing) {
      console.log(
        '⏭️ Skipping scheduled payouts execution - previous run still in progress'
      );
      return;
    }

    isProcessing = true;
    const startTime = Date.now();

    cronJobTracker.startExecution(JOB_NAME);

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('💰 Starting Scheduled Payouts Execution');
    console.log(`   Time: ${new Date().toISOString()}`);
    console.log('═══════════════════════════════════════════════════════');

    try {
      const now = new Date();

      // Find all payouts that are:
      // 1. Status: 'scheduled'
      // 2. Not cancelled
      // 3. Scheduled date has passed
      const duePayouts = await Payout.find({
        status: 'scheduled',
        cancelled: false,
        scheduledDate: { $lte: now },
      })
        .populate('organization', 'name stripeConnectAccountId')
        .populate('requestedBy', 'email');

      console.log(`📊 Found ${duePayouts.length} payout(s) due for execution`);

      if (duePayouts.length === 0) {
        console.log('✅ No scheduled payouts to process');
        cronJobTracker.completeExecution(JOB_NAME, {
          totalProcessed: 0,
          successCount: 0,
          failureCount: 0,
        });
        return;
      }

      let successCount = 0;
      let failureCount = 0;
      const errors: Array<{ id: string; error: string }> = [];

      // Process each payout
      for (const payout of duePayouts) {
        const payoutId = payout?._id?.toString();

        try {
          console.log(`\n💸 Processing payout: ${payoutId}`);
          console.log(`   Organization: ${(payout.organization as any).name}`);
          console.log(`   Amount: $${payout.organizationReceives.toFixed(2)}`);
          console.log(
            `   Scheduled Date: ${payout.scheduledDate.toISOString()}`
          );

          // Execute payout using existing service
          const result = await PayoutService.executePayout(
            payoutId!,
            'system' // Executed by cron job system
          );

          console.log(`✅ Payout executed successfully`);
          console.log(`   Transfer ID: ${result.transfer.id}`);
          console.log(`   Status: ${result.payout.status}`);

          successCount++;
        } catch (error: unknown) {
          const err = error as Error;
          failureCount++;
          const errorMessage = err.message || 'Unknown error';
          errors.push({ id: payoutId!, error: errorMessage });

          console.error(`❌ Failed to execute payout: ${payoutId}`);
          console.error(`   Error: ${errorMessage}`);

          // Update payout status to failed
          try {
            await Payout.findByIdAndUpdate(payoutId, {
              status: 'failed',
            });
          } catch (updateError) {
            console.error(`   Failed to update payout status:`, updateError);
          }
        }

        // Add small delay between payouts to avoid overwhelming Stripe API
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log('\n═══════════════════════════════════════════════════════');
      console.log('📊 Payout Execution Summary');
      console.log('═══════════════════════════════════════════════════════');
      console.log(`   Total Processed: ${duePayouts.length}`);
      console.log(`   ✅ Successful: ${successCount}`);
      console.log(`   ❌ Failed: ${failureCount}`);
      console.log(`   ⏱️ Duration: ${duration}s`);

      if (errors.length > 0) {
        console.log('\n❌ Failed Payouts:');
        errors.forEach(({ id, error }) => {
          console.log(`   - ${id}: ${error}`);
        });
      }

      console.log('═══════════════════════════════════════════════════════\n');

      cronJobTracker.completeExecution(JOB_NAME, {
        totalProcessed: duePayouts.length,
        successCount,
        failureCount,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error: unknown) {
      const err = error as Error;
      console.error('❌ Critical error in scheduled payouts cron job:');
      console.error(error);

      cronJobTracker.failExecution(JOB_NAME, err.message || 'Unknown error');
    } finally {
      isProcessing = false;
    }
  });

  job.start();
  console.log('✅ Scheduled Payouts Execution Cron Job started successfully\n');

  return job;
};

/**
 * Manual trigger for testing/debugging
 */
export const manualTriggerScheduledPayouts = async () => {
  console.log('🔧 Manually triggering scheduled payouts execution...');

  if (isProcessing) {
    console.log('⏭️ Cannot trigger - execution already in progress');
    return { success: false, message: 'Execution already in progress' };
  }

  isProcessing = true;

  try {
    const now = new Date();

    const duePayouts = await Payout.find({
      status: 'scheduled',
      cancelled: false,
      scheduledDate: { $lte: now },
    });

    console.log(`Found ${duePayouts.length} payout(s) due for execution`);

    const results = [];

    for (const payout of duePayouts) {
      try {
        const result = await PayoutService.executePayout(
          payout?._id?.toString()!,
          'system'
        );

        results.push({
          success: true,
          payoutId: payout?._id?.toString(),
          transferId: result.transfer.id,
          amount: result.payout.organizationReceives,
        });
      } catch (error: unknown) {
        const err = error as Error;
        results.push({
          success: false,
          payoutId: payout?._id?.toString(),
          error: err.message || 'Unknown error',
        });
      }
    }

    return { success: true, results };
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in manual trigger:', error);
    return { success: false, error: err.message };
  } finally {
    isProcessing = false;
  }
};
