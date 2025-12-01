// src/app/modules/Payout/payout.validation.ts

import { z } from 'zod';
import { PAYOUT_STATUS_VALUES } from './payout.constant';

// 1. Request payout schema (organization)
const requestPayoutSchema = z.object({
  body: z.object({
    // Optional: 'all' or specific amount
    requestedAmount: z
      .union([
        z.literal('all'),
        z.coerce
          .number()
          .positive({ message: 'Requested amount must be greater than 0' }),
      ])
      .optional(),

    // Required: scheduled date (today or future)
    scheduledDate: z.coerce.date({
      message: 'Scheduled date is required',
    }),

    // Optional notes
    notes: z
      .string()
      .max(1000, { message: 'Notes cannot exceed 1000 characters' })
      .optional(),

    // Optional filter by causes
    causeIds: z.array(z.string()).optional(),

    // Optional filter by donation type
    donationType: z
      .enum(['one-time', 'recurring', 'round-up', 'all'])
      .optional()
      .default('all'),
  }),
});

// 2. Get payout history schema (organization)
const getPayoutHistorySchema = z.object({
  query: z.object({
    status: z.enum(PAYOUT_STATUS_VALUES as [string, ...string[]]).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  }),
});

// 3. Get payout by ID schema
const getPayoutByIdSchema = z.object({
  params: z.object({
    id: z.string({
      message: 'Payout ID is required',
    }),
  }),
});

// 4. Admin: Get all scheduled payouts schema
const getAllPayoutsSchema = z.object({
  query: z.object({
    organizationId: z.string().optional(),
    status: z.enum(PAYOUT_STATUS_VALUES as [string, ...string[]]).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  }),
});

// 5. Admin: Execute payout schema
const executePayoutSchema = z.object({
  params: z.object({
    id: z.string({
      message: 'Payout ID is required',
    }),
  }),
});

// 6. Admin: Cancel payout schema
const cancelPayoutSchema = z.object({
  params: z.object({
    id: z.string({
      message: 'Payout ID is required',
    }),
  }),
  body: z.object({
    reason: z
      .string({
        message: 'Cancellation reason is required',
      })
      .min(3, { message: 'Reason must be at least 3 characters' })
      .max(500, { message: 'Reason cannot exceed 500 characters' }),
  }),
});

export const PayoutValidation = {
  requestPayoutSchema,
  getPayoutHistorySchema,
  getPayoutByIdSchema,
  getAllPayoutsSchema,
  executePayoutSchema,
  cancelPayoutSchema,
};
