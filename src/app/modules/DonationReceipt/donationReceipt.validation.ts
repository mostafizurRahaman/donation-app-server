import { z } from 'zod';

// 1. generateReceiptSchema
const generateReceiptSchema = z.object({
  body: z.object({
    donationId: z.string({
      error: 'Donation ID is required!',
    }),
    donorId: z.string({
      error: 'Donor ID is required!',
    }),
    organizationId: z.string({
      error: 'Organization ID is required!',
    }),
    donationAmount: z.number({
      error: 'Donation amount is required!',
    }).min(0.01, 'Donation amount must be greater than 0'),
    donationDate: z.coerce.date({
      error: 'Donation date is required!',
    }),
    donorName: z.string({
      error: 'Donor name is required!',
    }).min(1, 'Donor name cannot be empty'),
    organizationName: z.string({
      error: 'Organization name is required!',
    }).min(1, 'Organization name cannot be empty'),
    organizationABN: z.string({
      error: 'Organization ABN is required!',
    }).min(1, 'Organization ABN cannot be empty'),
    organizationStatus: z.enum(['tax-deductible', 'zakat-eligible', 'general'], {
      error: 'Organization status must be tax-deductible, zakat-eligible, or general',
    }),
    paymentMethod: z.string({
      error: 'Payment method is required!',
    }).min(1, 'Payment method cannot be empty'),
    stripeDestinationAccount: z.string().optional(),
  }),
});

// 2. getReceiptsByDonorSchema
const getReceiptsByDonorSchema = z.object({
  params: z.object({
    donorId: z.string({
      error: 'Donor ID is required!',
    }),
  }),
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  }),
});

// 3. getReceiptsByOrganizationSchema
const getReceiptsByOrganizationSchema = z.object({
  params: z.object({
    organizationId: z.string({
      error: 'Organization ID is required!',
    }),
  }),
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  }),
});

// 4. resendReceiptEmailSchema
const resendReceiptEmailSchema = z.object({
  params: z.object({
    receiptId: z.string({
      error: 'Receipt ID is required!',
    }),
  }),
  body: z.object({
    donorEmail: z.string().email('Invalid email format'),
  }),
});

// 5. downloadReceiptSchema
const downloadReceiptSchema = z.object({
  params: z.object({
    receiptId: z.string({
      error: 'Receipt ID is required!',
    }),
  }),
});

// 6. adminGetAllReceiptsSchema
const adminGetAllReceiptsSchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    organizationId: z.string().optional(),
    donorId: z.string().optional(),
    search: z.string().optional(),
  }),
});

export const DonationReceiptValidation = {
  generateReceiptSchema,
  getReceiptsByDonorSchema,
  getReceiptsByOrganizationSchema,
  resendReceiptEmailSchema,
  downloadReceiptSchema,
  adminGetAllReceiptsSchema,
};
