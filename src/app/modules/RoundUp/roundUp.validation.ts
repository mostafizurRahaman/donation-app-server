import { z } from 'zod';

// 1. Enable Round-Up Schema
const enableRoundUpSchema = z.object({
  body: z.object({
    charityId: z.string({
      error: 'Charity ID is required!',
    }),
    monthlyLimit: z.number({
      error: 'Monthly limit is required!',
    }).min(1, 'Monthly limit must be at least $1').max(1000, 'Monthly limit cannot exceed $1000'),
  }),
});

// 2. Update Round-Up Settings Schema
const updateRoundUpSettingsSchema = z.object({
  body: z.object({
    isEnabled: z.boolean().optional(),
    monthlyLimit: z.number().min(1).max(1000).optional(),
    charityId: z.string().optional(),
  }),
});

// 3. Basiq CDR Consent Schema
const basiqConsentSchema = z.object({
  body: z.object({
    consentId: z.string({
      error: 'Consent ID is required!',
    }),
    bankName: z.string({
      error: 'Bank name is required!',
    }),
    accountIds: z.array(z.string()).min(1, 'At least one account ID is required'),
    expiryDate: z.coerce.date({
      error: 'Expiry date is required!',
    }),
  }),
});

// 4. Revoke Consent Schema
const revokeConsentSchema = z.object({
  params: z.object({
    consentId: z.string({
      error: 'Consent ID is required!',
    }),
  }),
});

// 5. Get Round-Up History Schema
const getRoundUpHistorySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    charityId: z.string().optional(),
  }),
});

// 6. Process Transactions Schema (Internal)
const processTransactionsSchema = z.object({
  body: z.object({
    userId: z.string({
      error: 'User ID is required!',
    }),
    transactions: z.array(z.object({
      id: z.string(),
      accountId: z.string(),
      amount: z.string(),
      description: z.string(),
      postDate: z.string(),
      transactionDate: z.string(),
      class: z.string(),
    })).min(1, 'At least one transaction is required'),
  }),
});

// 7. Transfer Monthly Batch Schema (Internal)
const transferMonthlyBatchSchema = z.object({
  body: z.object({
    userId: z.string({
      error: 'User ID is required!',
    }),
    charityId: z.string({
      error: 'Charity ID is required!',
    }),
    month: z.number().min(1).max(12),
    year: z.number().min(2020),
  }),
});

// 8. Get Monthly Summary Schema
const getMonthlySummarySchema = z.object({
  query: z.object({
    month: z.coerce.number().min(1).max(12).optional(),
    year: z.coerce.number().min(2020).optional(),
  }),
});

// 9. Sync Transactions Schema
const syncTransactionsSchema = z.object({
  body: z.object({
    accountId: z.string().optional(),
    fromDate: z.coerce.date().optional(),
    toDate: z.coerce.date().optional(),
  }),
});

// 10. Admin Get All Round-Ups Schema
const adminGetAllRoundUpsSchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    userId: z.string().optional(),
    charityId: z.string().optional(),
    isProcessed: z.coerce.boolean().optional(),
  }),
});

export const RoundUpValidation = {
  enableRoundUpSchema,
  updateRoundUpSettingsSchema,
  basiqConsentSchema,
  revokeConsentSchema,
  getRoundUpHistorySchema,
  processTransactionsSchema,
  transferMonthlyBatchSchema,
  getMonthlySummarySchema,
  syncTransactionsSchema,
  adminGetAllRoundUpsSchema,
};
