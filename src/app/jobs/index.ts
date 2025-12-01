import { startRoundUpProcessingCron } from './roundUpTransactions.job';
import { startScheduledDonationsCron } from './scheduledDonations.job';
import { startRewardJobs } from './updateRewardsStatus.job';

/**
 * Initialize all cron jobs
 *
 * This function starts all scheduled background jobs for the application.
 * Should be called once during server startup.
 */
export const initializeJobs = () => {
  console.log('\n════════════════════════════════════════════════════════');
  console.log('🤖 Initializing Background Jobs');
  console.log('════════════════════════════════════════════════════════\n');

  try {
    // Start scheduled donations cron job
    startScheduledDonationsCron();

    // Start RoundUp transactions processing cron job
    startRoundUpProcessingCron();

    // Start reward maintenance job (every 5 minutes)
    startRewardJobs();

    console.log('════════════════════════════════════════════════════════');
    console.log('✅ All background jobs initialized successfully');
    console.log('════════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('❌ Failed to initialize background jobs:');
    console.error(error);
    throw error;
  }
};

export * from './scheduledDonations.job';
export * from './roundUpTransactions.job';
export * from './updateRewardsStatus.job';
