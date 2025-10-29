import { Router } from 'express';
import { ClientController } from './client.controller';
import { auth, validateRequest } from '../../middlewares';
import { ROLE } from '../Auth/auth.constant';
import { ClientValidation } from './client.validation';

const router = Router();

// updateProfile
router
  .route('/personal-info')
  .patch(
    auth(ROLE.CLIENT),
    validateRequest(ClientValidation.profileInfoSchema),
    ClientController.updateProfile
  );

// updatePreferences
router
  .route('/preferences')
  .patch(
    auth(ROLE.CLIENT),
    validateRequest(ClientValidation.preferencesSchema),
    ClientController.updatePreferences
  );

// updateNotificationPreferences
router
  .route('/notification-preferences')
  .patch(
    auth(ROLE.CLIENT),
    validateRequest(ClientValidation.notificationSchema),
    ClientController.updateNotificationPreferences
  );

// updatePrivacySecuritySettings
router
  .route('/privacy-security')
  .patch(
    auth(ROLE.CLIENT),
    validateRequest(ClientValidation.privacySecuritySchema),
    ClientController.updatePrivacySecuritySettings
  );

// getDiscoverArtists
router.route('/discover').get(auth(), ClientController.getDiscoverArtists);

// getAllServices
router.route('/').get(ClientController.getAllServices);

// updateClientRadius
router
  .route('/radius')
  .patch(
    auth(ROLE.CLIENT),
    validateRequest(ClientValidation.updateClientRadiusSchema),
    ClientController.updateClientRadius
  );

export const ClientRoutes = router;
