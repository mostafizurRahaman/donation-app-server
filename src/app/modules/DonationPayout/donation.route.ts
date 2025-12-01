import { Router } from 'express';
import { DonationPayoutController } from './donationPayout.controller';
import { DonationPayoutValidation } from './donationPayout.validation';
import { auth } from '../../middlewares';
import { validateRequest } from '../../middlewares/validateRequest';
import { ROLE } from '../Auth/auth.constant';

const router = Router();

/**
 * Base path when mounted: /donation-payout
 */

// 1. Get payout status for a specific donation
router.get(
  '/donation/:donationId/status',
  auth(ROLE.ADMIN, ROLE.ORGANIZATION),
  validateRequest(DonationPayoutValidation.getDonationPayoutStatusSchema),
  DonationPayoutController.getDonationPayoutStatus
);

// 2. Get all donation payouts for a specific payout
router.get(
  '/payout/:payoutId',
  auth(ROLE.ADMIN, ROLE.ORGANIZATION),
  validateRequest(DonationPayoutValidation.getDonationPayoutsByPayoutSchema),
  DonationPayoutController.getDonationPayoutsByPayout
);

// 3. Get paid donations for current organization (or orgId for admin)
router.get(
  '/organization/paid',
  auth(ROLE.ADMIN, ROLE.ORGANIZATION),
  validateRequest(
    DonationPayoutValidation.getPaidDonationsForOrganizationSchema
  ),
  DonationPayoutController.getPaidDonationsForCurrentOrganization
);

export const DonationPayoutRoutes = router;
