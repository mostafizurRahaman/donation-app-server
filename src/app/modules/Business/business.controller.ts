// import httpStatus from 'http-status';
// import Stripe from 'stripe';
// import config from '../../config';
// import { asyncHandler } from '../../utils';
// import { sendResponse } from '../../utils';
// import { BusinessService } from './business.service';
// import { TServiceImages } from '../../interface';

// const stripe = new Stripe(config.stripe.stripe_secret_key as string, {});

// // getAllArtists
// const getAllArtists = asyncHandler(async (req, res) => {
//   const result = await BusinessService.getAllArtistsFromDB(req.query, req.user);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     message: 'Businesses retrieved successfully!',
//     data: result.data,
//     meta: result.meta,
//   });
// });

// // getOwnArtistData
// const getOwnArtistData = asyncHandler(async (req, res) => {
//   const result = await BusinessService.getOwnArtistDataFromDB(req.user);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     message: 'Business retrieved successfully!',
//     data: result,
//   });
// });

// // getSingleArtist
// const getSingleArtist = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const result = await BusinessService.getSingleArtistFromDB(id);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     message: 'Business retrieved successfully!',
//     data: result,
//   });
// });

// // update artist personal info
// const updateArtistPersonalInfo = asyncHandler(async (req, res) => {
//   const result = await BusinessService.updateArtistPersonalInfoIntoDB(
//     req.user,
//     req.body
//   );

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     message: 'Updated profile successfully!',
//     data: result,
//   });
// });

// // updateArtistProfile
// const updateArtistProfile = asyncHandler(async (req, res) => {
//   const result = await BusinessService.updateArtistProfileIntoDB(
//     req.user,
//     req.body
//   );

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     message: 'Business profile updated successfully!',
//     data: result,
//   });
// });

// // updateArtistPreferences
// const updateArtistPreferences = asyncHandler(async (req, res) => {
//   const result = await BusinessService.updateArtistPreferencesIntoDB(
//     req.user,
//     req.body
//   );

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     message: 'Business preferences updated successfully!',
//     data: result,
//   });
// });

// // updateArtistNotificationPreferences
// const updateArtistNotificationPreferences = asyncHandler(async (req, res) => {
//   const result =
//     await BusinessService.updateArtistNotificationPreferencesIntoDB(
//       req.user,
//       req.body
//     );

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     message: 'Business notification preferences updated successfully!',
//     data: result,
//   });
// });

// // updateArtistPrivacySecuritySettings
// const updateArtistPrivacySecuritySettings = asyncHandler(async (req, res) => {
//   const result =
//     await BusinessService.updateArtistPrivacySecuritySettingsIntoDB(
//       req.user,
//       req.body
//     );

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     message: 'Business privacy and security settings updated successfully!',
//     data: result,
//   });
// });

// // update artist flashes
// const updateArtistFlashes = asyncHandler(async (req, res) => {
//   const files = req.files as Express.Multer.File[] | undefined;
//   const result = await BusinessService.updateArtistFlashesIntoDB(
//     req.user,
//     files
//   );

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     message: 'Flashes updated successfully!',
//     data: result,
//   });
// });

// // boost profile
// const boostProfile = asyncHandler(async (req, res) => {
//   const result = await BusinessService.boostProfileIntoDb(req.user);
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     message: 'Profile boost successfully!',
//     data: result,
//   });
// });

// // update artist
// const updateArtistPortfolio = asyncHandler(async (req, res) => {
//   const files = req.files as Express.Multer.File[] | undefined;
//   const result = await BusinessService.updateArtistPortfolioIntoDB(
//     req.user,
//     files
//   );

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     message: 'Portfolio updated successfully!',
//     data: result,
//   });
// });

// // addArtistService
// const addArtistService = asyncHandler(async (req, res) => {
//   const files = req.files as TServiceImages;
//   const result = await BusinessService.createService(req.user, req.body, files);

//   sendResponse(res, {
//     statusCode: httpStatus.CREATED,
//     message: 'Service created successfully!',
//     data: result,
//   });
// });

// const getServicesByArtist = asyncHandler(async (req, res) => {
//   const result = await BusinessService.getServicesByArtistFromDB(req.user);

//   sendResponse(res, {
//     statusCode: httpStatus.CREATED,
//     message: 'Services retrieved successfully!',
//     data: result,
//   });
// });

// const getArtistSchedule = asyncHandler(async (req, res) => {
//   const year = Number(req.query.year);
//   const month = Number(req.query.month);
//   const result = await BusinessService.getArtistMonthlySchedule(
//     req.user,
//     year,
//     month
//   );

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     message: 'Services retrieved successfully!',
//     data: result,
//   });
// });

// // updateArtistServiceById
// const updateArtistServiceById = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const files = req.files as TServiceImages;
//   const result = await BusinessService.updateArtistServiceByIdIntoDB(
//     id,
//     req.body,
//     files,
//     req.user
//   );

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     message: 'Service updated successfully!',
//     data: result,
//   });
// });

// // get artist dashboard
// const getArtistDashboardPage = asyncHandler(async (req, res) => {
//   const result = await BusinessService.getArtistDashboardPage(req.user);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     message: 'Service deleted successfully!',
//     data: result,
//   });
// });

// // deleteArtistService
// const deleteArtistService = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   const result = await BusinessService.deleteArtistServiceFromDB(id, req.user);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     message: 'Service deleted successfully!',
//     data: result,
//   });
// });

// // removeimage
// const removeImage = asyncHandler(async (req, res) => {
//   const filePath = req.body.filePath;
//   const result = await BusinessService.removeImageFromDB(req.user, filePath);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     message: 'Flash removed successfully!',
//     data: result,
//   });
// });

// // setArtistTimeOff
// const setArtistTimeOff = asyncHandler(async (req, res) => {
//   const result = await BusinessService.setArtistTimeOffIntoDB(
//     req.user,
//     req.body
//   );

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     message: 'Time off updated successfully!',
//     data: result,
//   });
// });

// // createConnectedAccountAndOnboardingLinkForArtist
// const createConnectedAccountAndOnboardingLinkForArtist = asyncHandler(
//   async (req, res) => {
//     const result =
//       await BusinessService.createConnectedAccountAndOnboardingLinkForArtistIntoDb(
//         req.user
//       );

//     sendResponse(res, {
//       statusCode: httpStatus.OK,
//       message: 'Onboarding account url is generated successfully!',
//       data: result,
//     });
//   }
// );

// const deleteAccount = asyncHandler(async (req, res) => {
//   await stripe.accounts.del(req.body.accountId);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     message: 'account deleted successfully!',
//     data: null,
//   });
// });

// // get availibility
// // const getAvailabilityExcludingTimeOff = asyncHandler(async (req, res) => {
// //   const artistId = req.params.id;
// //   const month = Number(req.query.month);
// //   const year = Number(req.query.year);
// //   const result = await ArtistService.getAvailabilityExcludingTimeOff(
// //     artistId,
// //     month,
// //     year
// //   );

// //   sendResponse(res, {
// //     statusCode: httpStatus.OK,
// //     message: 'Availability retrieved successfully!',
// //     data: result,
// //   });
// // });

// // For availability
// // const updateAvailability = asyncHandler(async (req, res) => {
// //   const result = await ArtistService.updateAvailability(req.user, req.body);

// //   sendResponse(res, {
// //     statusCode: httpStatus.OK,
// //     message: 'Availability updated successfully!',
// //     data: result,
// //   });
// // });

// export const BusinessController = {
//   getAllArtists,
//   getOwnArtistData,
//   getSingleArtist,
//   updateArtistPersonalInfo,
//   updateArtistProfile,
//   boostProfile,
//   updateArtistPreferences,
//   updateArtistNotificationPreferences,
//   updateArtistPrivacySecuritySettings,
//   updateArtistFlashes,
//   updateArtistPortfolio,
//   addArtistService,
//   getServicesByArtist,
//   getArtistSchedule,
//   updateArtistServiceById,
//   deleteArtistService,
//   removeImage,
//   setArtistTimeOff,
//   createConnectedAccountAndOnboardingLinkForArtist,
//   deleteAccount,
//   getArtistDashboardPage,
//   // updateAvailability,
//   // getAvailabilityExcludingTimeOff,
// };
