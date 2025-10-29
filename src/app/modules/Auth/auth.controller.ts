import httpStatus from 'http-status';
import {  asyncHandler } from '../../utils';
import { AuthService } from './auth.service';
// import { TProfileFileFields } from '../../types';
import sendResponse from '../../utils/sendResponse';

// 1. createAuth
const createAuth = asyncHandler(async (req, res) => {
  const result = await AuthService.createAuthIntoDB(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'OTP sent successfully, verify your account in 5 minutes!',
    data: result,
  });
});

// 2. sendSignupOtpAgain
const sendSignupOtpAgain = asyncHandler(async (req, res) => {
  const userEmail = req.body.userEmail;
  const result = await AuthService.sendSignupOtpAgain(userEmail);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'OTP sent again successfully, verify in 5 minutes!',
    data: result,
  });
});

// 3. verifySignupOtp
// const verifySignupOtp = asyncHandler(async (req, res) => {
//   const userEmail = req.body.userEmail;
//   const otp = req.body.otp;
//   const result = await AuthService.verifySignupOtpIntoDB(userEmail, otp);

//   sendResponse(res, {
//     statusCode: httpStatus.CREATED,
//     message: 'OTP verified successfully!',
//     data: result,
//   });
// });

// 4. signin
// const signin = asyncHandler(async (req, res) => {
//   const result = await AuthService.signinIntoDB(req.body);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     message: 'Signin successful!',
//     data: result,
//   });
// });

// 5. createProfile
// const createProfile = asyncHandler(async (req, res) => {
//   const body = req.body;
//   const user = req.user;
//   const files = (req?.files as TProfileFileFields) || {};
//   const result = await AuthService.createProfileIntoDB(body, user, files);

//   sendResponse(res, {
//     statusCode: httpStatus.CREATED,
//     message: 'Applied for the profile, have patience for Admin approval!',
//     data: result,
//   });
// });

// 5. checkProfileStatus
// const checkProfileStatus = asyncHandler(async (req, res) => {
//   const user = req.user;
//   const result = await AuthService.checkProfileStatusIntoDB(user);

//   sendResponse(res, {
//     statusCode: httpStatus.CREATED,
//     message: 'This profile is verified!',
//     data: result,
//   });
// });

// clientCreateProfile
// const clientCreateProfile = asyncHandler(async (req, res) => {
//   const body = req.body;
//   const user = req.user;
//   const result = await AuthService.clientCreateProfileIntoDB(body, user);

//   sendResponse(res, {
//     statusCode: httpStatus.CREATED,
//     message: 'Applied for the profile, have patience for Admin approval!',
//     data: result,
//   });
// });

// artistCreateProfile
// const artistCreateProfile = asyncHandler(async (req, res) => {
//   const body = req.body;
//   const user = req.user;
//   const files = (req.files as TProfileFileFields) || {};
//   const result = await AuthService.artistCreateProfileIntoDB(body, user, files);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     message: 'Applied for the profile, have patience for Admin approval!',
//     data: result,
//   });
// });

// businessCreateProfile
// const businessCreateProfile = asyncHandler(async (req, res) => {
//   const body = req.body;
//   const user = req.user;
//   const files = (req.files as TProfileFileFields) || {};
//   const result = await AuthService.businessCreateProfileIntoDB(
//     body,
//     user,
//     files
//   );

//   sendResponse(res, {
//     statusCode: httpStatus.CREATED,
//     message: 'Applied for the profile, have patience for Admin approval!',
//     data: result,
//   });
// });

// 6. socialSignin
// const socialSignin = asyncHandler(async (req, res) => {
//   const { response, accessToken, refreshToken } =
//     await AuthService.socialLoginServices(req.body);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     message: 'Signin successful!',
//     data: { response, accessToken, refreshToken },
//   });
// });

// 7. updateProfilePhoto
// const updateProfilePhoto = asyncHandler(async (req, res) => {
//   const result = await AuthService.updateProfilePhotoIntoDB(req.user, req.file);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     message: 'Photo updated successfully!',
//     data: result,
//   });
// });

// 8. changePassword
// const changePassword = asyncHandler(async (req, res) => {
//   const result = await AuthService.changePasswordIntoDB(req.body, req.user);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     message: 'Password changed successfully!',
//     data: result,
//   });
// });

// 9. forgotPassword
// const forgotPassword = asyncHandler(async (req, res) => {
//   const email = req.body.email;
//   const result = await AuthService.forgotPassword(email);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     message:
//       'OTP sent to your email. Please check your spam or junk folder too!',
//     data: result,
//   });
// });

// 9. sendForgotPasswordOtpAgain
// const sendForgotPasswordOtpAgain = asyncHandler(async (req, res) => {
//   const token = req.body.token;
//   const result = await AuthService.sendForgotPasswordOtpAgain(token);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     message: 'OTP sent again. Please check your spam or junk folder too!',
//     data: result,
//   });
// });

// 10. verifyOtpForForgotPassword
// const verifyOtpForForgotPassword = asyncHandler(async (req, res) => {
//   const result = await AuthService.verifyOtpForForgotPassword(req.body);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     message: 'OTP verified successfully!',
//     data: result,
//   });
// });

// 11. resetPassword
const resetPassword = asyncHandler(async (req, res) => {
  const resetPasswordToken = req
    ?.header('Authorization')
    ?.replace('Bearer ', '');

  const result = await AuthService.resetPasswordIntoDB(
    resetPasswordToken!,
    req.body.newPassword
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Password has been reset successfully!',
    data: result,
  });
});

// 12. fetchProfile
// const fetchProfile = asyncHandler(async (req, res) => {
//   const result = await AuthService.fetchProfileFromDB(req.user);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     message: 'Profile data retrieved successfully!',
//     data: result,
//   });
// });

// 13. fetchClientConnectedAccount
// const fetchClientConnectedAccount = asyncHandler(async (req, res) => {
//   const result = await AuthService.fetchAllConnectedAcount(req.user);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     message: 'Discover artists retrieved successfully!',
//     data: result,
//   });
// });

// 14. deactivateUserAccount
const deactivateUserAccount = asyncHandler(async (req, res) => {
  const result = await AuthService.deactivateUserAccountFromDB(
    req.user,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Account Deactivate successfully!',
    data: result,
  });
});

// 15. deleteSpecificAccount
// const deleteSpecificUserAccount = asyncHandler(async (req, res) => {
//   const result = await AuthService.deleteSpecificUserAccount(req.user);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     message: 'Account Deleted successfully!',
//     data: result,
//   });
// });

// 16. getNewAccessToken
// const getNewAccessToken = asyncHandler(async (req, res) => {
//   const refreshToken = req.headers.authorization?.replace('Bearer ', '');

//   if (!refreshToken) {
//     throw new AppError(httpStatus.BAD_REQUEST, 'Refresh token is required!');
//   }

//   const result = await AuthService.getNewAccessTokenFromServer(refreshToken);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     message: 'Access token given successfully!',
//     data: result,
//   });
// });

// 17. updateAuthData
// const updateAuthData = asyncHandler(async (req, res) => {
//   const result = await AuthService.updateAuthDataIntoDB(req.body, req.user);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     message: 'Data updated successfully!',
//     data: result,
//   });
// });

// 18. updateFcmToken
const updateFcmToken = asyncHandler(async (req, res) => {
  const result = await AuthService.updateFcmTokenIntoDB(req.body, req.user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Token updated successfully!',
    data: result,
  });
});

// 19. getUserForConversation
const getUserForConversation = asyncHandler(async (req, res) => {
  const searchTerm = req.query.term as string;
  const currentUserId = req.user._id.toString();

  const result = await AuthService.getUserForConversationFromDB(
    searchTerm,
    currentUserId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'User fetched successfully!',
    data: result,
  });
});

export const AuthController = {
  createAuth,
  sendSignupOtpAgain,
  // verifySignupOtp,
  // signin,
  // createProfile,
  // checkProfileStatus,
  // clientCreateProfile,
  // artistCreateProfile,
  // businessCreateProfile,
  // socialSignin,
  // updateProfilePhoto,
  // changePassword,
  // forgotPassword,
  // sendForgotPasswordOtpAgain,
  // verifyOtpForForgotPassword,
  resetPassword,
  // fetchProfile,
  // fetchClientConnectedAccount,
  deactivateUserAccount,
  // deleteSpecificUserAccount,
  // getNewAccessToken,
  // updateAuthData,
  updateFcmToken,
  getUserForConversation,
};
