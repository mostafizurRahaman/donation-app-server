// src/app/modules/Payout/payout.route.ts

import express from 'express';
import { PayoutController } from './payout.controller';
import { PayoutValidation } from './payout.validation';
import { auth } from '../../middlewares';
import { validateRequest } from '../../middlewares/validateRequest';
import { ROLE } from '../Auth/auth.constant';

const router = express.Router();

// ==========================
// ORGANIZATION ROUTES
// ==========================

// Request a payout
// POST /api/payout/request
router.post(
  '/request',
  auth(ROLE.ORGANIZATION),
  validateRequest(PayoutValidation.requestPayoutSchema),
  PayoutController.requestPayoutForOrganization
);

// Get payout summary (dashboard)
// GET /api/payout/summary
router.get(
  '/summary',
  auth(ROLE.ORGANIZATION),
  PayoutController.getPayoutSummaryForOrganization
);

// Get payout history
// GET /api/payout/history
router.get(
  '/history',
  auth(ROLE.ORGANIZATION),
  validateRequest(PayoutValidation.getPayoutHistorySchema),
  PayoutController.getPayoutHistoryForOrganization
);

// Get donations included in a specific payout
// GET /api/payout/:id/donations
router.get(
  '/:id/donations',
  auth(ROLE.ORGANIZATION, ROLE.ADMIN),
  validateRequest(PayoutValidation.getPayoutByIdSchema),
  PayoutController.getPayoutDonations
);

// ==========================
// ADMIN ROUTES
// ==========================

// Get all scheduled payouts
// GET /api/payout/admin/scheduled
router.get(
  '/admin/scheduled',
  auth(ROLE.ADMIN),
  validateRequest(PayoutValidation.getAllPayoutsSchema),
  PayoutController.getAllScheduledPayouts
);

// Execute payout (manual trigger)
// POST /api/payout/admin/:id/execute
router.post(
  '/admin/:id/execute',
  auth(ROLE.ADMIN),
  validateRequest(PayoutValidation.executePayoutSchema),
  PayoutController.executePayout
);

// Cancel payout
// POST /api/payout/admin/:id/cancel
router.post(
  '/admin/:id/cancel',
  auth(ROLE.ADMIN),
  validateRequest(PayoutValidation.cancelPayoutSchema),
  PayoutController.cancelPayout
);

export const PayoutRoutes = router;
