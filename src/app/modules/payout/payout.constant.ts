export const PAYOUT_STATUS = {
  SCHEDULED: 'scheduled',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
} as const;

export const PAYOUT_STATUS_VALUES = Object.values(PAYOUT_STATUS);

export const DEFAULT_PLATFORM_FEE_PERCENTAGE = 2.9; // 2.9% platform fee
export const MIN_PAYOUT_AMOUNT = 10.0; // Minimum $10 for payout
export const MAX_PAYOUT_AMOUNT = 100000.0; // Maximum $100,000 per payout

export const PAYOUT_SCHEDULE_TIME = '09:00:00'; // Default 9 AM UTC

export const PAYOUT_MESSAGES = {
  REQUEST_SUCCESS: 'Payout request submitted successfully',
  REQUEST_FAILED: 'Failed to request payout',
  INSUFFICIENT_BALANCE: 'Insufficient balance for payout',
  NO_DONATIONS: 'No donations available for payout',
  ALREADY_SCHEDULED: 'A payout is already scheduled for this organization',
  EXECUTION_SUCCESS: 'Payout executed successfully',
  EXECUTION_FAILED: 'Payout execution failed',
  CANCELLATION_SUCCESS: 'Payout cancelled successfully',
  CANCELLATION_FAILED: 'Failed to cancel payout',
  STRIPE_ERROR: 'Stripe transfer failed',
  ORGANIZATION_NOT_CONNECTED:
    'Organization has not completed Stripe Connect setup',
  STRIPE_CONNECT_NOT_READY: 'Stripe Connect account is not ready for payouts',
  NO_PAYOUT_METHOD:
    'No bank account or debit card linked to Stripe Connect account',
  INVALID_SCHEDULE_DATE: 'Scheduled date must be today or in the future',
  PAYOUT_NOT_FOUND: 'Payout not found',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  CANNOT_CANCEL_COMPLETED: 'Cannot cancel a completed payout',
  CANNOT_EXECUTE_CANCELLED: 'Cannot execute a cancelled payout',
} as const;

export const PAYOUT_SORT_FIELDS = [
  'scheduledDate',
  'executedAt',
  'totalAmount',
  'status',
  'createdAt',
] as const;

export const PAYOUT_FILTER_FIELDS = [
  'status',
  'cancelled',
  'organizationId',
] as const;

// Stripe Connect validation messages
export const STRIPE_CONNECT_ISSUES = {
  NO_ACCOUNT: 'Stripe Connect onboarding not completed',
  NOT_VERIFIED: 'Stripe Connect verification not completed',
  CHARGES_DISABLED: 'Account not enabled to receive charges',
  PAYOUTS_DISABLED: 'Account not enabled for payouts',
  NO_EXTERNAL_ACCOUNT: 'No bank account or debit card linked for payouts',
  ACCOUNT_RESTRICTED: 'Stripe Connect account is restricted',
  DETAILS_NOT_SUBMITTED: 'Please complete Stripe Connect verification',
} as const;
