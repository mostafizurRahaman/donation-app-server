import httpStatus from 'http-status';
import { asyncHandler } from '../../utils';
import { ClientService } from './client.service';
import sendResponse from '../../utils/sendResponse';
import Auth from '../Auth/auth.model';
import { verifyToken } from '../../lib';
import config from '../../config';
import { JwtPayload } from 'jsonwebtoken';

// updateProfile
const updateProfile = asyncHandler(async (req, res) => {
  const result = await ClientService.updateProfile(req.user, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Profile information updated successfully!',
    data: result,
  });
});

// updatePreferences
const updatePreferences = asyncHandler(async (req, res) => {
  const result = await ClientService.updatePreferences(req.user, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Preferences updated successfully!',
    data: result,
  });
});

// updateNotificationPreferences
const updateNotificationPreferences = asyncHandler(async (req, res) => {
  const result = await ClientService.updateNotificationPreferences(
    req.user,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Notification preferences updated successfully!',
    data: result,
  });
});

// updatePrivacySecuritySettings
const updatePrivacySecuritySettings = asyncHandler(async (req, res) => {
  const result = await ClientService.updatePrivacySecuritySettings(
    req.user,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Privacy and security settings updated successfully!',
    data: result,
  });
});

// getDiscoverArtists
const getDiscoverArtists = asyncHandler(async (req, res) => {
  const result = await ClientService.getDiscoverArtistsFromDB(
    req.user,
    req.query
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Discover artists retrieved successfully!',
    data: result.data,
    meta: result.meta,
  });
});

// getAllServices
const getAllServices = asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || '';

  let decoded: Record<string, unknown> = {};
  if (token) {
    decoded = verifyToken(token, config.jwt.access_secret!) as JwtPayload;
  }

  const { id } = decoded;
  const user = await Auth.findById(id);

  const result = await ClientService.getAllServicesFromDB(user, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Discover artists retrieved successfully!',
    data: result.data,
    meta: result.meta,
  });
});

// updateClientRadius
const updateClientRadius = asyncHandler(async (req, res) => {
  const result = await ClientService.updateClientRadiusIntoDB(
    req.user,
    req.body.radius
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Radius updated successfully!',
    data: result,
  });
});

export const ClientController = {
  updateProfile,
  updatePreferences,
  updateNotificationPreferences,
  updatePrivacySecuritySettings,
  getDiscoverArtists,
  getAllServices,
  updateClientRadius,
};
