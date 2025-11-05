import express from 'express';
import { DonationReceiptController } from './donationReceipt.controller';
import { DonationReceiptValidation } from './donationReceipt.validation';
import { validateRequest } from '../../middlewares/validateRequest';
import auth from '../../middlewares/auth';
import { ROLE } from '../Auth/auth.constant';

const router = express.Router();

// Generate receipt (internal use - called by donation service)
router.post(
  '/generate',
  validateRequest(DonationReceiptValidation.generateReceiptSchema),
  DonationReceiptController.generateReceipt
);

// Get receipts by donor
router.get(
  '/donor/:donorId',
  auth(ROLE.CLIENT, ROLE.ADMIN),
  validateRequest(DonationReceiptValidation.getReceiptsByDonorSchema),
  DonationReceiptController.getReceiptsByDonor
);

// Get receipts by organization
router.get(
  '/organization/:organizationId',
  auth(ROLE.ORGANIZATION, ROLE.ADMIN),
  validateRequest(DonationReceiptValidation.getReceiptsByOrganizationSchema),
  DonationReceiptController.getReceiptsByOrganization
);

// Get receipt by ID
router.get(
  '/:receiptId',
  validateRequest(DonationReceiptValidation.downloadReceiptSchema),
  DonationReceiptController.getReceiptById
);

// Resend receipt email
router.post(
  '/:receiptId/resend-email',
  auth(ROLE.CLIENT, ROLE.ADMIN),
  validateRequest(DonationReceiptValidation.resendReceiptEmailSchema),
  DonationReceiptController.resendReceiptEmail
);

// Download receipt
router.get(
  '/:receiptId/download',
  validateRequest(DonationReceiptValidation.downloadReceiptSchema),
  DonationReceiptController.downloadReceipt
);

// Admin routes
router.get(
  '/admin/all',
  auth(ROLE.ADMIN),
  validateRequest(DonationReceiptValidation.adminGetAllReceiptsSchema),
  DonationReceiptController.adminGetAllReceipts
);

export const DonationReceiptRoutes = router;
