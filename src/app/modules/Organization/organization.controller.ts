import httpStatus from 'http-status';
import { asyncHandler } from '../../utils';
import { BusinessService } from './organization.service';
import sendResponse from '../../utils/sendResponse';

const updateBusinessProfile = asyncHandler(async (req, res) => {
  const result = await BusinessService.updateBusinessProfile(
    req.user,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Business profile updated successfully!',
    data: result,
  });
});

const updateBusinessPreferences = asyncHandler(async (req, res) => {
  const result = await BusinessService.updateBusinessPreferences(
    req.user,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Business preferences updated successfully!',
    data: result,
  });
});

const updateBusinessNotificationPreferences = asyncHandler(async (req, res) => {
  const result = await BusinessService.updateBusinessNotificationPreferences(
    req.user,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Business notification preferences updated successfully!',
    data: result,
  });
});

const updateBusinessSecuritySettings = asyncHandler(async (req, res) => {
  const result = await BusinessService.updateBusinessSecuritySettings(
    req.user,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Business security and privacy settings updated successfully!',
    data: result,
  });
});

// updateAvailability
// const updateAvailability = asyncHandler(async (req, res) => {
//   const result = await BusinessService.updateGuestSpotsIntoDB(req.user, req.body);

//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     message: 'Guest spots updated successfully!',
//     data: result,
//   });
// });

const updateTimeOff = asyncHandler(async (req, res) => {
  const result = await BusinessService.updateTimeOff(req.user, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Time off updated successfully!',
    data: result,
  });
});

const fetchBusinessArtist = asyncHandler(async (req, res) => {
  const result = await BusinessService.getBusinessArtists(req.user, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Artist removed successfully!',
    data: result,
  });
});

const removeArtist = asyncHandler(async (req, res) => {
  const result = await BusinessService.removeArtistFromDB(
    req.user,
    req.params.artistId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Artist removed successfully!',
    data: result,
  });
});

export const BusinessController = {
  updateBusinessProfile,
  updateBusinessPreferences,
  updateBusinessNotificationPreferences,
  updateBusinessSecuritySettings,
  // updateAvailability,
  fetchBusinessArtist,
  updateTimeOff,
  removeArtist,
};
