// src/app/modules/Payout/donationPayout.validation.ts

import { z } from 'zod';

// 1. Get donation payout status (by donationId)
const getDonationPayoutStatusSchema = z.object({
  params: z.object({
    donationId: z
      .string({
        message: 'Donation ID is required',
      })
      .min(1, { message: 'Donation ID is required' }),
  }),
});

// 2. Get donation payouts by payoutId
const getDonationPayoutsByPayoutSchema = z.object({
  params: z.object({
    payoutId: z
      .string({
        message: 'Payout ID is required',
      })
      .min(1, { message: 'Payout ID is required' }),
  }),
});

// 3. Get paid donations for current organization (or orgId for admin)
const getPaidDonationsForOrganizationSchema = z.object({
  query: z.object({
    organizationId: z.string().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  }),
});

export const DonationPayoutValidation = {
  getDonationPayoutStatusSchema,
  getDonationPayoutsByPayoutSchema,
  getPaidDonationsForOrganizationSchema,
};
