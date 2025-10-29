import { Router } from 'express';
import { BusinessController } from './business.controller';
import { auth, validateRequest } from '../../middlewares';
import { ROLE } from '../Auth/auth.constant';
import { ArtistValidation } from './business.validation';
import { upload } from '../../lib';
// import { validateRequestFromFormData } from '../../middlewares/validateRequest';

const router = Router();

// getAllArtists
router.route('/').get(auth(ROLE.BUSINESS), BusinessController.getAllArtists);

// getOwnArtistData
router
  .route('/own')
  .get(auth(ROLE.BUSINESS), BusinessController.getOwnArtistData);

// getSingleArtist
router
  .route('/single/:id')
  .get(auth(ROLE.CLIENT, ROLE.BUSINESS), BusinessController.getSingleArtist);

// updateArtistPersonalInfo
// router
//   .route('/')
//   .patch(
//     auth(ROLE.BUSINESS),
//     validateRequest(ArtistValidation.updateSchema),
//     ArtistController.updateArtistPersonalInfo
//   );

// updateArtistProfile
router
  .route('/profile')
  .patch(
    auth(ROLE.BUSINESS),
    validateRequest(ArtistValidation.artistProfileSchema),
    BusinessController.updateArtistProfile
  );

// updateArtistPreferences
router
  .route('/preferences')
  .patch(
    auth(ROLE.BUSINESS),
    validateRequest(ArtistValidation.artistPreferencesSchema),
    BusinessController.updateArtistPreferences
  );

// updateArtistNotificationPreferences
router
  .route('/notification-preferences')
  .patch(
    auth(ROLE.BUSINESS),
    validateRequest(ArtistValidation.artistNotificationSchema),
    BusinessController.updateArtistNotificationPreferences
  );

// updateArtistPrivacySecuritySettings
router
  .route('/privacy-security')
  .patch(
    auth(ROLE.BUSINESS),
    validateRequest(ArtistValidation.artistPrivacySecuritySchema),
    BusinessController.updateArtistPrivacySecuritySettings
  );

// updateArtistFlashes
router
  .route('/flashes')
  .post(
    auth(ROLE.BUSINESS),
    upload.array('files'),
    BusinessController.updateArtistFlashes
  );

// updateArtistPortfolio
router
  .route('/portfolio')
  .post(
    auth(ROLE.BUSINESS),
    upload.array('files'),
    BusinessController.updateArtistPortfolio
  );

// addArtistService
// router.route('/service/create').post(
//   upload.fields([
//     { name: 'images', maxCount: 5 },
//     { name: 'thumbnail', maxCount: 1 },
//   ]),
//   auth(ROLE.BUSINESS),
//   validateRequestFromFormData(ArtistServiceValidation.createServiceSchema),
//   ArtistController.addArtistService
// );

router
  .route('/dashboard')
  .get(auth(ROLE.BUSINESS), BusinessController.getArtistDashboardPage);

// getServicesByArtist
router
  .route('/services')
  .get(auth(ROLE.BUSINESS), BusinessController.getServicesByArtist);

// updateArtistService
// router.route('/service/update/:id').patch(
//   upload.fields([
//     { name: 'images', maxCount: 5 },
//     { name: 'thumbnail', maxCount: 1 },
//   ]),
//   auth(ROLE.BUSINESS),
//   validateRequestFromFormData(ArtistServiceValidation.updateServiceSchema),
//   ArtistController.updateArtistServiceById
// );

// deleteArtistService
router
  .route('/service/delete/:id')
  .delete(auth(ROLE.BUSINESS), BusinessController.deleteArtistService);

// removeImage
router
  .route('/remove-image')
  .delete(auth(ROLE.BUSINESS), BusinessController.removeImage);

router
  .route('/schedule')
  .get(auth(ROLE.BUSINESS), BusinessController.getArtistSchedule);

router
  .route('/boost-profile')
  .post(auth(ROLE.BUSINESS), BusinessController.boostProfile);
// getAvailabilityExcludingTimeOff
// router
//   .route('/availability/:id')
//   .get(ArtistController.getAvailabilityExcludingTimeOff)

// setArtistTimeOff
router
  .route('/days-off')
  .patch(
    auth(ROLE.BUSINESS),
    validateRequest(ArtistValidation.setOffDaysSchema),
    BusinessController.setArtistTimeOff
  );

// createConnectedAccountAndOnboardingLinkForArtist
router
  .route('/create-onboarding-account')
  .post(
    auth(ROLE.BUSINESS),
    BusinessController.createConnectedAccountAndOnboardingLinkForArtist
  );

router.route('/delete-account').post(BusinessController.deleteAccount);

export const BusinessRoutes = router;
