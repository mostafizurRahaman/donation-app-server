// import { Logger } from './logger';
import AppError from './AppError';
import asyncHandler from './asyncHandler';
import { deleteFile } from './deleteFile';
import globalErrorHandler from './globalErrorHandler';
import notFoundHandler from './notFound';
import sendContactUsEmail from './sendContactUsEmail';
import sendOtpEmail from './sendOtpEmail';
import sendResponse from './sendResponse';

// JWT configuration
const options = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
  maxAge: 365 * 24 * 60 * 60 * 1000,
};

export {
  AppError,
  asyncHandler,
  globalErrorHandler,
  notFoundHandler,
  options,
  sendOtpEmail,
  deleteFile,
  sendContactUsEmail,
  sendResponse,
  // Logger
};
