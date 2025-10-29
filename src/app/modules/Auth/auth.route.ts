import { Router } from 'express';
import { auth, validateRequest } from '../../middlewares';
import { AuthValidation } from './auth.validation';
import { AuthController } from './auth.controller';
// import { upload } from '../../lib';
// import { validateRequestFromFormData } from '../../middlewares/validateRequest';
import { ROLE } from './auth.constant';

const router = Router();

router
  .route('/signup')
  .post(
    validateRequest(AuthValidation.createAuthSchema),
    AuthController.createAuth
  );

// 2. sendSignupOtpAgain
// router
//   .route('/send-signup-otp-again')
//   .post(
//     validateRequest(AuthValidation.sendSignupOtpAgainSchema),
//     AuthController.sendSignupOtpAgain
//   );

// 3. verifySignupOtp
// router
//   .route('/verify-signup-otp')
//   .post(
//     validateRequest(AuthValidation.verifySignupOtpSchema),
//     AuthController.verifySignupOtp
//   );

// 4. signin
// router
//   .route('/signin')
//   .post(validateRequest(AuthValidation.signinSchema), AuthController.signin);

// 5. createProfile
// router.route('/create-Profile').post(
//   upload.fields([
//     { name: 'idFrontPart', maxCount: 1 },
//     { name: 'idBackPart', maxCount: 1 },
//     { name: 'selfieWithId', maxCount: 1 },
//     { name: 'registrationCertificate', maxCount: 1 },
//     { name: 'taxIdOrEquivalent', maxCount: 1 },
//     { name: 'studioLicense', maxCount: 1 },
//   ]),
//   auth(ROLE.CLIENT, ROLE.ARTIST, ROLE.BUSINESS),
//   validateRequestFromFormData(AuthValidation.createProfileSchema),
//   AuthController.createProfile
// );

// 5. checkProfileStatus
// router
//   .route('/check-status')
//   .get(
//     auth(ROLE.CLIENT, ROLE.BUSINESS, ROLE.ORGANIZATION),
//     AuthController.checkProfileStatus
//   );

// // clientCreateProfile
// router.route('/client-create-Profile').post(
//   auth(ROLE.CLIENT),
//   validateRequestFromFormData(AuthValidation.createProfileSchema),
//   AuthController.clientCreateProfile
// );

// // artistCreateProfile
// router.route('/artist-create-Profile').post(
//   upload.fields([
//     { name: 'idFrontPart', maxCount: 1 },
//     { name: 'idBackPart', maxCount: 1 },
//     { name: 'selfieWithId', maxCount: 1 },
//   ]),
//   auth(ROLE.CLIENT),
//   validateRequestFromFormData(AuthValidation.createProfileSchema),
//   AuthController.artistCreateProfile
// );

// // businessCreateProfile
// router.route('/business-create-Profile').post(
//   upload.fields([
//     { name: 'registrationCertificate', maxCount: 1 },
//     { name: 'taxIdOrEquivalent', maxCount: 1 },
//     { name: 'studioLicense', maxCount: 1 },
//   ]),
//   auth(ROLE.CLIENT, ROLE.ARTIST),
//   validateRequestFromFormData(AuthValidation.createProfileSchema),
//   AuthController.businessCreateProfile
// );

// 6. socialSignin
// router
//   .route('/social-signin')
//   .post(
//     validateRequest(AuthValidation.socialSigninSchema),
//     AuthController.socialSignin
//   );

// 7. updateProfilePhoto
// router
//   .route('/update-profile-photo')
//   .put(auth(), upload.single('file'), AuthController.updateProfilePhoto);

// 8. changePassword
// router.route('/change-password').patch(
//   auth(ROLE.CLIENT, ROLE.BUSINESS, ROLE.ORGANIZATION, ROLE.ADMIN),
//   // validateRequest(AuthValidation.changePasswordSchema),
//   AuthController.changePassword
// );

// 9. forgotPassword
// router
//   .route('/forgot-password')
//   .post(
//     validateRequest(AuthValidation.forgotPasswordSchema),
//     AuthController.forgotPassword
// );

// router
//   .route('/send-forgot-password-otp-again')
//   .post(
//     validateRequest(AuthValidation.sendForgotPasswordOtpAgainSchema),
//     AuthController.sendForgotPasswordOtpAgain
//   );

// 10. verifyOtpForForgotPassword
// router
//   .route('/verify-forgot-password-otp')
//   .post(
//     validateRequest(AuthValidation.verifyOtpForForgotPasswordSchema),
//     AuthController.verifyOtpForForgotPassword
//   );

router
  .route('/reset-password')
  .post(
    validateRequest(AuthValidation.resetPasswordSchema),
    AuthController.resetPassword
  );

// 12. fetchProfile
// router.route('/profile').get(auth(), AuthController.fetchProfile);

// 13. fetchClientConnectedAccount
// router
//   .route('/connected-account')
//   .get(
//     auth(ROLE.CLIENT, ROLE.BUSINESS, ROLE.ORGANIZATION),
//     AuthController.fetchClientConnectedAccount
//   );

router
  .route('/deactive-account')
  .post(
    auth(ROLE.CLIENT, ROLE.BUSINESS, ROLE.ORGANIZATION),
    validateRequest(AuthValidation.deactivateUserAccountSchema),
    AuthController.deactivateUserAccount
  );

// 15. deleteSpecificUserAccount
// router
//   .route('/delete-account')
//   .delete(
//     auth(ROLE.CLIENT, ROLE.BUSINESS, ROLE.ORGANIZATION),
//     AuthController.deleteSpecificUserAccount
//   );

// 16. getNewAccessToken
// router.route('/access-token').get(AuthController.getNewAccessToken);

// 17. updateAuthData
// router
//   .route('/update-auth-data')
//   .patch(
//     auth(ROLE.CLIENT, ROLE.BUSINESS, ROLE.ORGANIZATION),
//     validateRequest(AuthValidation.updateAuthDataSchema),
//     AuthController.updateAuthData
//   );

router
  .route('/save-fcm-token')
  .put(
    auth(ROLE.CLIENT, ROLE.BUSINESS, ROLE.ORGANIZATION),
    validateRequest(AuthValidation.updateFcmTokenSchema),
    AuthController.updateFcmToken
  );

router
  .route('/message-user/search')
  .get(
    auth(ROLE.CLIENT, ROLE.BUSINESS, ROLE.ORGANIZATION),
    validateRequest(AuthValidation.getUserForConversationSchema),
    AuthController.getUserForConversation
  );

export const AuthRoutes = router;
