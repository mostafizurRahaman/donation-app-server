import express from 'express';
import { RoundUpController } from './roundUp.controller';
import { RoundUpValidation } from './roundUp.validation';
import { validateRequest } from '../../middlewares/validateRequest';
import auth from '../../middlewares/auth';
import { ROLE } from '../Auth/auth.constant';

const router = express.Router();

// Enable round-up donations
router.post(
  '/enable',
  auth(ROLE.CLIENT),
  validateRequest(RoundUpValidation.enableRoundUpSchema),
  RoundUpController.enableRoundUp
);

// Update round-up settings
router.patch(
  '/settings',
  auth(ROLE.CLIENT),
  validateRequest(RoundUpValidation.updateRoundUpSettingsSchema),
  RoundUpController.updateRoundUpSettings
);

// Get user settings
router.get(
  '/settings',
  auth(ROLE.CLIENT),
  RoundUpController.getUserSettings
);

// Get consent URL for Basiq CDR
router.get(
  '/consent-url',
  auth(ROLE.CLIENT),
  RoundUpController.getConsentUrl
);

// Store Basiq CDR consent
router.post(
  '/consent',
  auth(ROLE.CLIENT),
  validateRequest(RoundUpValidation.basiqConsentSchema),
  RoundUpController.storeConsent
);

// Revoke CDR consent
router.delete(
  '/consent/:consentId',
  auth(ROLE.CLIENT),
  validateRequest(RoundUpValidation.revokeConsentSchema),
  RoundUpController.revokeConsent
);

// Sync transactions (manual trigger)
router.post(
  '/sync',
  auth(ROLE.CLIENT),
  validateRequest(RoundUpValidation.syncTransactionsSchema),
  RoundUpController.syncTransactions
);

// Get round-up history
router.get(
  '/history',
  auth(ROLE.CLIENT),
  validateRequest(RoundUpValidation.getRoundUpHistorySchema),
  RoundUpController.getRoundUpHistory
);

// Get monthly summary
router.get(
  '/summary',
  auth(ROLE.CLIENT),
  validateRequest(RoundUpValidation.getMonthlySummarySchema),
  RoundUpController.getMonthlySummary
);

// Internal/Admin routes
router.post(
  '/batch/create',
  auth(ROLE.ADMIN),
  validateRequest(RoundUpValidation.transferMonthlyBatchSchema),
  RoundUpController.createMonthlyBatch
);

export const RoundUpRoutes = router;
