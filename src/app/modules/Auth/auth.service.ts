// import fs from 'fs';
import httpStatus from 'http-status';
// import jwt, { SignOptions } from 'jsonwebtoken';
// import { startSession } from 'mongoose';
// import { z } from 'zod';
import config from '../../config';
import {
  createAccessToken,
  createRefreshToken,
  generateOtp,
  verifyToken,
} from '../../lib';
import {
  TDeactiveAccountPayload,
  // TProfileFileFields,
  // TSocialLoginPayload,
} from '../../types';
import { AppError, sendOtpEmail } from '../../utils';
// import Business from '../Business/business.model';
// import Organization from '../Organization/organization.model';
// import Client from '../Client/client.model';
import { defaultUserImage } from './auth.constant';
import { IAuth } from './auth.interface';
// import { AuthValidation } from './auth.validation';
import Auth from './auth.model';

const OTP_EXPIRY_MINUTES = Number(config.otp_expiry_minutes);

// 1. createAuthIntoDB
const createAuthIntoDB = async (payload: IAuth) => {
  // const existingUser = await Auth.findOne({ email: payload.email });
  const existingUser = await Auth.isUserExistsByEmail(payload.email);

  // if user exists but unverified
  if (existingUser && !existingUser.isVerifiedByOTP) {
    const now = new Date();

    // if OTP expired sending new otp
    if (!existingUser.otpExpiry || existingUser.otpExpiry < now) {
      const otp = generateOtp();
      await sendOtpEmail(payload.email, otp, 'User');

      existingUser.otp = otp;
      existingUser.otpExpiry = new Date(
        now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000
      );
      await existingUser.save();

      throw new AppError(
        httpStatus.BAD_REQUEST,
        'You have an unverified account, verify it with the new OTP sent to the mail!'
      );
    } else {
      // if OTP is valid till now
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'You have an unverified account, verify it now with the otp sent to the mail!'
      );
    }
  } else if (existingUser && existingUser.isVerifiedByOTP) {
    // if user is already verified
    throw new AppError(httpStatus.BAD_REQUEST, 'User already exists!');
  } else if (!existingUser) {
    //  OTP generating and sending if user is new
    const otp = generateOtp();
    await sendOtpEmail(payload.email, otp, 'User');

    // Save new user as unverified
    const now = new Date();
    const newUser = await Auth.create({
      ...payload,
      otp,
      otpExpiry: new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000),
      isVerifiedByOTP: false,
    });

    // const token = jwt.sign({ ...payload, otp }, config.jwt.otp_secret!, {
    //   expiresIn: config.jwt.otp_secret_expires_in!,
    // } as SignOptions);

    return {
      userEmail: newUser.email,
      // token
    };
  }
};

// 2. sendSignupOtpAgain
const sendSignupOtpAgain = async (userEmail: string) => {
  // const user = await Auth.findOne({ email: userEmail });
  const user = await Auth.isUserExistsByEmail(userEmail);

  if (!user) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'You must sign up first to get an OTP!'
    );
  }

  if (user.isVerifiedByOTP) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'This account is already verified!'
    );
  }

  const now = new Date();

  // sending new OTP if previous one is expired
  if (!user.otpExpiry || user.otpExpiry < now) {
    const otp = generateOtp();

    // send OTP via Email
    await sendOtpEmail(user.email, otp, 'User');

    user.otp = otp;
    user.otpExpiry = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);
    await user.save();

    // new token (optional, if needed to verify OTP from client side)
    // const newToken = jwt.sign(
    //   { email: user.email, phoneNumber: user.phoneNumber },
    //   config.jwt.otp_secret!,
    //   { expiresIn: config.jwt.otp_secret_expires_in! } as SignOptions
    // );

    return {
      userEmail: user.email,
      // token: newToken,
    };
  }

  // if OTP is still valid

  await sendOtpEmail(user.email, user.otp, 'User');
  throw new AppError(
    httpStatus.BAD_REQUEST,
    'An OTP was already sent. Please wait until it expires before requesting a new one.'
  );
};

// 3. verifySignupOtpIntoDB
// const verifySignupOtpIntoDB = async (userEmail: string, otp: string) => {
//   // const user = await Auth.findOne({ email: userEmail });
//   const user = await Auth.isUserExistsByEmail(userEmail);

//   if (!user) {
//     throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
//   }

//   if (user.isVerifiedByOTP) {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       'This account is already verified!'
//     );
//   }

//   // If OTP is invalid, throw error
//   if (user?.otp !== otp) {
//     throw new AppError(httpStatus.BAD_REQUEST, 'Invalid OTP!');
//   }

//   // Check if OTP is expired
//   const now = new Date();
//   if (!user.otpExpiry || user.otpExpiry < now) {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       'OTP has expired. Please request a new one!'
//     );
//   }

//   // Mark user as verified
//   user.isVerifiedByOTP = true;
//   await user.save();

//   // Prepare user payload for tokens
//   const userData = {
//     id: user?._id.toString(),
//     email: user?.email,
//     phoneNumber: user?.phoneNumber,
//     stringLocation: '123 Main St, Springfield, IL',
//     role: user?.role,
//     image: user?.image || defaultUserImage,
//     fullName: user?.fullName,
//     isProfile: user?.isProfile,
//     isActive: user?.isActive,
//   };

//   // Generate access and refresh tokens
//   const accessToken = createAccessToken(userData);
//   const refreshToken = createRefreshToken(userData);

//   // Return tokens to client
//   return {
//     // user: userData,
//     accessToken,
//     refreshToken,
//   };
// };

// 4. signinIntoDB
// const signinIntoDB = async (payload: {
//   email: string;
//   password: string;
//   fcmToken: string;
// }) => {
//   // const user = await Auth.findOne({ email: payload.email }).select('+password');
//   const user = await Auth.isUserExistsByEmail(payload.email);

//   if (!user) {
//     throw new AppError(httpStatus.NOT_FOUND, 'User does not exist!');
//   }

//   if (!user.isVerifiedByOTP) {
//     const otp = generateOtp();

//     await sendOtpEmail(user.email, otp, 'User');

//     user.otp = otp;
//     user.otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
//     await user.save();

//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       'Verify your account with the new OTP in your phone!'
//     );
//   }

//   // Validate password
//   const isPasswordCorrect = await user.isPasswordMatched(payload.password);

//   if (!isPasswordCorrect) {
//     throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid credentials!');
//   }

//   await user.save();

//   // Prepare user data for tokens
//   const userData = {
//     id: user._id.toString(),
//     fullName: user?.fullName,
//     phoneNumber: user.phoneNumber,
//     stringLocation: stringLocation,
//     email: user.email,
//     role: user.role,
//     image: user?.image || defaultUserImage,
//     isProfile: user?.isProfile,
//     isActive: user?.isActive,
//   };

//   // Generate tokens
//   const accessToken = createAccessToken(userData);
//   const refreshToken = createRefreshToken(userData);

//   // Return tokens and optionally user info
//   return {
//     // user: userData,
//     accessToken,
//     refreshToken,
//   };
// };

// 5. createProfileIntoDB
// const createProfileIntoDB = async (
//   payload: TProfilePayload,
//   user: IAuth,
//   files: TProfileFileFields
// ) => {
//   // Prevent creating multiple profiles for same user
//   if (user.isProfile) {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       'Your profile is already saved!'
//     );
//   }

//   // Destructure relevant fields from the payload
//   const {
//     role,

//     radius,
//     notificationPreferences,

//     artistType,
//     expertise,
//     description,
//     hourlyRate,
//     // city,

//     studioName,
//     businessType,
//     servicesOffered,
//     contactNumber,
//     contactEmail,
//     operatingHours,
//   } = payload;

//   // Extract file paths for ID verification images for artists
//   const idCardFront = files?.idFrontPart?.[0]?.path.replace(/\\/g, '/') || null;
//   const idCardBack = files?.idBackPart?.[0]?.path.replace(/\\/g, '/') || null;
//   const selfieWithId =
//     files?.selfieWithId?.[0]?.path.replace(/\\/g, '/') || null;

//   // Business-specific file extractions
//   const registrationCertificate =
//     files?.registrationCertificate?.[0]?.path.replace(/\\/g, '/') || null;
//   const taxIdOrEquivalent =
//     files?.taxIdOrEquivalent?.[0]?.path.replace(/\\/g, '/') || null;
//   const studioLicense =
//     files?.studioLicense?.[0]?.path.replace(/\\/g, '/') || null;

//   // stringLocation
//   // const stringLocation = getLocationName(mainLocation?.coordinates as number[]);

//   // Start a MongoDB session for transaction
//   const session = await startSession();

//   try {
//     session.startTransaction();

//     // CLIENT PROFILE CREATION
//     if (role === ROLE.CLIENT) {
//       const isExistClient = await Client.findOne({ auth: user._id });
//       if (isExistClient) {
//         throw new AppError(
//           httpStatus.BAD_REQUEST,
//           'Client data already saved in database'
//         );
//       }

//       const clientPayload = {
//         auth: user._id,
//         role,
//         location: mainLocation,
//         stringLocation,
//         radius,
//         lookingFor,
//         favoriteTattoos,
//       };

//       const [client] = await Client.create([clientPayload], { session });

//       const clientPreferenceData: any = {
//         clientId: client._id,
//         notificationPreferences,
//       };

//       if (user?.isSocialLogin) {
//         clientPreferenceData.connectedAccounts = [
//           {
//             provider: 'google',
//             connectedOn: user?.createdAt || new Date(),
//           },
//         ];
//       }

//       await Auth.findByIdAndUpdate(
//         user._id,
//         { role: ROLE.CLIENT, isProfile: true },
//         { session }
//       );

//       await ClientPreferences.create([clientPreferenceData], { session });

//       await session.commitTransaction();
//       await session.endSession();

//       const jwtPayload = {
//         id: user._id.toString(),
//         fullName: user.fullName,
//         phoneNumber: user.phoneNumber,
//         stringLocation: stringLocation,
//         email: user.email,
//         image: user.image || defaultUserImage,
//         role: user.role,
//         isProfile: true,
//         isActive: user?.isActive,
//       };

//       const accessToken = createAccessToken(jwtPayload);
//       const refreshToken = createRefreshToken(jwtPayload);

//       return {
//         accessToken,
//         refreshToken,
//       };
//     } else if (role === ROLE.BUSINESS) {
//       // ARTIST PROFILE CREATION
//       const isExistArtist = await Business.findOne({ auth: user._id });
//       if (isExistArtist) {
//         throw new AppError(
//           httpStatus.BAD_REQUEST,
//           'Artist profile already exists.'
//         );
//       }

//       const artistPayload = {
//         auth: user._id,
//         type: artistType,
//         expertise,
//         description,
//         hourlyRate,
//         idCardFront,
//         idCardBack,
//         selfieWithId,
//       };

//       const [artist] = await Business.create([artistPayload], { session });

//       const [artistPreferences] = await ArtistPreferences.create(
//         [{ artistId: artist._id }],
//         { session }
//       );

//       await Auth.findByIdAndUpdate(
//         user._id,
//         { role: ROLE.ARTIST, isActive: false, isProfile: true },
//         { session }
//       );

//       await Business.findByIdAndUpdate(
//         artist._id,
//         { preferences: artistPreferences._id },
//         { session }
//       );

//       await session.commitTransaction();
//       await session.endSession();

//       const jwtPayload = {
//         id: user._id.toString(),
//         fullName: user.fullName,
//         phoneNumber: user.phoneNumber,
//         stringLocation: stringLocation,
//         email: user.email,
//         image: user.image || defaultUserImage,
//         role: user.role,
//         isProfile: true,
//         isActive: false,
//       };

//       const accessToken = createAccessToken(jwtPayload);
//       const refreshToken = createRefreshToken(jwtPayload);

//       return {
//         accessToken,
//         refreshToken,
//       };
//     } else if (role === ROLE.ORGANIZATION) {
//       // BUSINESS PROFILE CREATION
//       const isExistOrganization = await Organization.findOne({
//         auth: user._id,
//       });
//       if (isExistOrganization) {
//         throw new AppError(
//           httpStatus.BAD_REQUEST,
//           'Business profile already exists.'
//         );
//       }

//       const organizationPayload = {
//         auth: user._id,

//         // city,

//         studioName,
//         servicesOffered,
//         contact: {
//           phone: contactNumber,
//           email: contactEmail,
//         },
//         operatingHours,
//         registrationCertificate,
//         taxIdOrEquivalent,
//         studioLicense,
//       };

//       const [organization] = await Organization.create([organizationPayload], {
//         session,
//       });

//       const [organizationPreferences] = await BusinessPreferences.create(
//         [{ businessId: organization._id }],
//         { session }
//       );

//       await Auth.findByIdAndUpdate(
//         user._id,
//         { role: ROLE.BUSINESS, isActive: false, isProfile: true },
//         { session }
//       );

//       await Business.findByIdAndUpdate(
//         organization._id,
//         { preferences: organizationPreferences._id },
//         { session }
//       );

//       await session.commitTransaction();
//       await session.endSession();

//       const jwtPayload = {
//         id: user._id.toString(),
//         fullName: user.fullName,
//         phoneNumber: user.phoneNumber,
//         stringLocation: stringLocation,
//         email: user.email,
//         image: user.image || defaultUserImage,
//         role: user.role,
//         isProfile: true,
//         isActive: false,
//       };

//       const accessToken = createAccessToken(jwtPayload);
//       const refreshToken = createRefreshToken(jwtPayload);

//       return {
//         accessToken,
//         refreshToken,
//       };
//     }
//   } catch (error: any) {
//     // ❌ Roll back transaction in case of any error
//     await session.abortTransaction();
//     await session.endSession();

//     // 🧼 Cleanup: Delete uploaded files to avoid storage bloat
//     if (files && typeof files === 'object' && !Array.isArray(files)) {
//       Object.values(files).forEach((fileArray) => {
//         fileArray.forEach((file) => {
//           try {
//             if (file?.path && fs.existsSync(file.path)) {
//               fs.unlinkSync(file.path);
//             }
//           } catch (deleteErr) {
//             // eslint-disable-next-line no-console
//             console.warn(
//               'Failed to delete uploaded file:',
//               file.path,
//               deleteErr
//             );
//           }
//         });
//       });
//     }

//     // Re-throw application-specific errors
//     if (error instanceof AppError) {
//       throw error;
//     }

//     // Throw generic internal server error
//     throw new AppError(
//       httpStatus.INTERNAL_SERVER_ERROR,
//       error?.message || 'Failed to create profile. Please try again.'
//     );
//   }
// };

// 5. checkProfileStatusIntoDB
// const checkProfileStatusIntoDB = async (user: IAuth) => {
//   let stringLocation: string = '';
//   if (!user.isProfile) {
//     throw new AppError(httpStatus.BAD_REQUEST, 'You need to create a profile!');
//   } else if (!user.isActive) {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       'This profile is not checked yet, wait for the admin approval!'
//     );
//   } else if (user.role === 'CLIENT') {
//     const client = await Client.findOne({ auth: user?._id });

//     if (!client) {
//       throw new AppError(
//         httpStatus.NOT_FOUND,
//         'Your client profile not found!'
//       );
//     }
//     stringLocation = client.stringLocation;
//   } else if (user.role === 'ARTIST') {
//     const artist = await Business.findOne({ auth: user?._id });

//     if (!artist) {
//       throw new AppError(
//         httpStatus.NOT_FOUND,
//         'Your client profile not found!'
//       );
//     }
//     stringLocation = artist.stringLocation;
//   } else if (user.role === 'BUSINESS') {
//     const business = await Business.findOne({ auth: user?._id });

//     if (!business) {
//       throw new AppError(
//         httpStatus.NOT_FOUND,
//         'Your client profile not found!'
//       );
//     }
//     stringLocation = business.stringLocation;
//   }

//   const jwtPayload = {
//     id: user._id.toString(),
//     fullName: user.fullName,
//     phoneNumber: user.phoneNumber,
//     stringLocation,
//     email: user.email,
//     image: user.image || defaultUserImage,
//     role: user.role,
//     isProfile: true,
//     isActive: user?.isActive,
//   };

//   const accessToken = createAccessToken(jwtPayload);
//   const refreshToken = createRefreshToken(jwtPayload);

//   return {
//     accessToken,
//     refreshToken,
//   };
// };

// // clientCreateProfileIntoDB
// const clientCreateProfileIntoDB = async (
//   payload: TProfilePayload,
//   user: IAuth
// ) => {
//   // Prevent creating multiple profiles for same user
//   if (user.isProfile) {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       'Your profile is already saved!'
//     );
//   }

//   // Destructure relevant fields from the payload
//   const {
//     role,
//     location,
//     radius,
//     lookingFor,
//     favoriteTattoos,
//     notificationPreferences,
//   } = payload;

//   // Start a MongoDB session for transaction
//   const session = await startSession();

//   try {
//   session.startTransaction();

//     // CLIENT PROFILE CREATION
//     const isExistClient = await Client.findOne({ auth: user._id });
//     if (isExistClient) {
//       throw new AppError(
//         httpStatus.BAD_REQUEST,
//         'Client data already saved in database'
//       );
//     }

//     const clientPayload = {
//       auth: user._id,
//       role,
//       location,
//       radius,
//       lookingFor,
//       favoriteTattoos,
//     };

//     const [client] = await Client.create([clientPayload], { session });

//     const clientPreferenceData: any = {
//       clientId: client._id,
//       notificationPreferences,
//     };

//     if (user?.isSocialLogin) {
//       clientPreferenceData.connectedAccounts = [
//         {
//           provider: 'google',
//           connectedOn: user?.createdAt || new Date(),
//         },
//       ];
//     }

//     await Auth.findByIdAndUpdate(
//       user._id,
//       { role: ROLE.CLIENT, isProfile: true },
//       { session }
//     );

//     await ClientPreferences.create([clientPreferenceData], { session });

//     await session.commitTransaction();
//     await session.endSession();

//     return client;
//   } catch (error: any) {
//     // ❌ Roll back transaction in case of any error
//     await session.abortTransaction();
//     await session.endSession();

//     // Re-throw application-specific errors
//     if (error instanceof AppError) {
//       throw error;
//     }

//     // Throw generic internal server error
//     throw new AppError(
//       httpStatus.INTERNAL_SERVER_ERROR,
//       error?.message || 'Failed to create profile. Please try again.'
//     );
//   }
// };

// // artistCreateProfileIntoDB
// const artistCreateProfileIntoDB = async (
//   payload: TProfilePayload,
//   user: IAuth,
//   files: TProfileFileFields
// ) => {
//   // Prevent creating multiple profiles for same user
//   if (user.isProfile) {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       'Your profile is already saved!'
//     );
//   }

//   // Destructure relevant fields from the payload
//   const { location, artistType, expertise, city } = payload;

//   // Extract file paths for ID verification images and business documents
//   const idCardFront = files.idFrontPart?.[0]?.path.replace(/\\/g, '/') || '';
//   const idCardBack = files.idBackPart?.[0]?.path.replace(/\\/g, '/') || '';
//   const selfieWithId = files.selfieWithId?.[0]?.path.replace(/\\/g, '/') || '';

//   // Start a MongoDB session for transaction
//   const session = await startSession();

//   try {
//   session.startTransaction();

//     // ARTIST PROFILE CREATION
//     const isExistArtist = await Artist.findOne({ auth: user._id });
//     if (isExistArtist) {
//       throw new AppError(
//         httpStatus.BAD_REQUEST,
//         'Artist profile already exists.'
//       );
//     }

//     const artistPayload = {
//       auth: user._id,
//       type: artistType,
//       expertise,
//       location,
//       city,
//       idCardFront,
//       idCardBack,
//       selfieWithId,
//     };

//     const [artist] = await Artist.create([artistPayload], { session });

//     const [artistPreferences] = await ArtistPreferences.create(
//       [{ artistId: artist._id }],
//       { session }
//     );

//     await Auth.findByIdAndUpdate(
//       user._id,
//       { role: ROLE.ARTIST, isActive: false, isProfile: true },
//       { session }
//     );

//     await Artist.findByIdAndUpdate(
//       artist._id,
//       { preferences: artistPreferences._id },
//       { session }
//     );

//     await session.commitTransaction();
//     await session.endSession();

//     return artist;
//   } catch (error: any) {
//     // ❌ Roll back transaction in case of any error
//     await session.abortTransaction();
//     await session.endSession();

//     // 🧼 Cleanup: Delete uploaded files to avoid storage bloat
//     if (files && typeof files === 'object' && !Array.isArray(files)) {
//       Object.values(files).forEach((fileArray) => {
//         fileArray.forEach((file) => {
//           try {
//             if (file?.path && fs.existsSync(file.path)) {
//               fs.unlinkSync(file.path);
//             }
//           } catch (deleteErr) {
//             // eslint-disable-next-line no-console
//             console.warn(
//               'Failed to delete uploaded file:',
//               file.path.replace(/\\/g, '/'),
//               deleteErr
//             );
//           }
//         });
//       });
//     }

//     // Re-throw application-specific errors
//     if (error instanceof AppError) {
//       throw error;
//     }

//     // Throw generic internal server error
//     throw new AppError(
//       httpStatus.INTERNAL_SERVER_ERROR,
//       error?.message || 'Failed to create profile. Please try again.'
//     );
//   }
// };

// // businessCreateProfileIntoDB
// const businessCreateProfileIntoDB = async (
//   payload: TProfilePayload,
//   user: IAuth,
//   files: TProfileFileFields
// ) => {
//   // Prevent creating multiple profiles for same user
//   if (user.isProfile) {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       'Your profile is already saved!'
//     );
//   }

//   // Destructure relevant fields from the payload
//   const {
//     location,
//     studioName,
//     city,
//     businessType,
//     servicesOffered,
//     contactNumber,
//     contactEmail,
//     operatingHours,
//   } = payload;

//   // Business-specific file extractions
//   const registrationCertificate =
//     files.registrationCertificate?.[0]?.path.replace(/\\/g, '/') || '';
//   const taxIdOrEquivalent = files.taxIdOrEquivalent?.[0]?.path.replace(/\\/g, '/') || '';
//   const studioLicense = files.studioLicense?.[0]?.path.replace(/\\/g, '/') || '';

//   // Start a MongoDB session for transaction
//   const session = await startSession();

//   try {
//   session.startTransaction();

//     // BUSINESS PROFILE CREATION
//     const isExistBusiness = await Business.findOne({ auth: user._id });
//     if (isExistBusiness) {
//       throw new AppError(
//         httpStatus.BAD_REQUEST,
//         'Business profile already exists.'
//       );
//     }

//     const businessPayload = {
//       auth: user._id,
//       studioName,
//       businessType,
//       servicesOffered,
//       location,
//       city,
//       contact: {
//         phone: contactNumber,
//         email: contactEmail,
//       },
//       operatingHours,
//       registrationCertificate,
//       taxIdOrEquivalent,
//       studioLicense,
//     };

//     const [business] = await Business.create([businessPayload], { session });

//     const [businessPreferences] = await BusinessPreferences.create(
//       [{ businessId: business._id }],
//       { session }
//     );

//     await Auth.findByIdAndUpdate(
//       user._id,
//       { role: ROLE.BUSINESS, isActive: false, isProfile: true },
//       { session }
//     );

//     await Business.findByIdAndUpdate(
//       business._id,
//       { preferences: businessPreferences._id },
//       { session }
//     );

//     await session.commitTransaction();
//     await session.endSession();

//     return business;
//   } catch (error: any) {
//     // ❌ Roll back transaction in case of any error
//     await session.abortTransaction();
//     await session.endSession();

//     // 🧼 Cleanup: Delete uploaded files to avoid storage bloat
//     if (files && typeof files === 'object' && !Array.isArray(files)) {
//       Object.values(files).forEach((fileArray) => {
//         fileArray.forEach((file) => {
//           try {
//             if (file?.path && fs.existsSync(file.path)) {
//               fs.unlinkSync(file.path);
//             }
//           } catch (deleteErr) {
//             // eslint-disable-next-line no-console
//             console.warn(
//               'Failed to delete uploaded file:',
//               file.path.replace(/\\/g, '/'),
//               deleteErr
//             );
//           }
//         });
//       });
//     }

//     // Re-throw application-specific errors
//     if (error instanceof AppError) {
//       throw error;
//     }

//     // Throw generic internal server error
//     throw new AppError(
//       httpStatus.INTERNAL_SERVER_ERROR,
//       error?.message || 'Failed to create profile. Please try again.'
//     );
//   }
// };

// 6. socialLoginServices
// const socialLoginServices = async (payload: TSocialLoginPayload) => {
//   const { email, fcmToken, image, fullName, phoneNumber, address } = payload;

//   // Check if user exists
//   // const user = await Auth.findOne({ email });
//   const user = await Auth.isUserExistsByEmail(email);

//   const otp = generateOtp();
//   const now = new Date();

//   if (!user) {
//     const newUser = await Auth.create({
//       email,
//       fcmToken,
//       image,
//       fullName,
//       phoneNumber,
//       address,
//       otp,
//       otpExpiry: now,
//       isSocialLogin: true,
//       isVerifiedByOTP: true,
//     });

//     if (!newUser) {
//       throw new AppError(
//         httpStatus.INTERNAL_SERVER_ERROR,
//         'Failed to create user into database!'
//       );
//     }

//     const userData = {
//       id: newUser._id.toString(),
//       email: newUser.email,
//       phoneNumber: newUser.phoneNumber,
//       stringLocation: '123 Main St, Springfield, IL',
//       role: newUser.role,
//       image: newUser?.image || defaultUserImage,
//       fullName: newUser?.fullName,
//       isProfile: newUser?.isProfile,
//       isActive: newUser?.isActive,
//     };

//     const accessToken = createAccessToken(userData);
//     const refreshToken = createRefreshToken(userData);

//     // await Auth.findByIdAndUpdate(authRes._id, { refreshToken });

//     return {
//       response: {
//         fullName: newUser.fullName,
//         email: newUser.email,
//         phoneNumber: newUser.phoneNumber,
//         role: newUser.role,
//         image: newUser.image,
//         isProfile: newUser.isProfile,
//       },
//       accessToken,
//       refreshToken,
//     };
//   } else {
//     let stringLocation: string = 'Not Set Yet';

//     if (user.role === 'CLIENT') {
//       const client = await Client.findOne({ auth: user._id });
//       stringLocation = client?.stringLocation || '123 Main St, Springfield, IL';
//     }

//     if (user.role === 'ARTIST') {
//       const artist = await Business.findOne({ auth: user._id });
//       stringLocation = artist?.stringLocation || '123 Main St, Springfield, IL';
//     }

//     if (user.role === 'BUSINESS') {
//       const business = await Business.findOne({ auth: user._id });
//       stringLocation =
//         business?.stringLocation || '123 Main St, Springfield, IL';
//     }

//     // Prepare user data for tokens
//     const userData = {
//       id: user._id.toString(),
//       email: user.email,
//       phoneNumber: user.phoneNumber,
//       stringLocation: stringLocation,
//       role: user.role,
//       image: user?.image || defaultUserImage,
//       fullName: user?.fullName,
//       isProfile: user?.isProfile,
//       isActive: user?.isActive,
//     };

//     const accessToken = createAccessToken(userData);
//     const refreshToken = createRefreshToken(userData);

//     // user.refreshToken = refreshToken;
//     user.fcmToken = fcmToken;
//     await user.save({ validateBeforeSave: false });

//     return {
//       response: {
//         fullName: user.fullName,
//         email: user.email,
//         phoneNumber: user.phoneNumber,
//         role: user.role,
//         image: user.image,
//         isProfile: user.isProfile,
//       },
//       accessToken,
//       refreshToken,
//     };
//   }
// };

// 7. updateProfilePhotoIntoDB
// const updateProfilePhotoIntoDB = async (
//   user: IAuth,
//   file: Express.Multer.File | undefined
// ) => {
//   if (!file?.path) {
//     throw new AppError(httpStatus.BAD_REQUEST, 'File is required!');
//   }

//   // Delete the previous image if exists
//   if (user?.image) {
//     try {
//       await fs.promises.unlink(user.image);
//     } catch (error: unknown) {
//       // eslint-disable-next-line no-console
//       console.error('Error deleting old file:', error);
//     }
//   }

//   const userNewData = await Auth.findByIdAndUpdate(
//     user._id,
//     { image: file.path.replace(/\\/g, '/') },
//     { new: true }
//   ).select('fullName email image role isProfile phoneNumber');

//   if (!userNewData) {
//     await fs.promises.unlink(file?.path);

//     throw new AppError(
//       httpStatus.INTERNAL_SERVER_ERROR,
//       'Something went wrong!'
//     );
//   }

//   let stringLocation: string = 'Not Set Yet';

//   if (user.role === 'CLIENT') {
//     const client = await Client.findOne({ auth: user._id });
//     stringLocation = client?.stringLocation || '123 Main St, Springfield, IL';
//   }

//   if (user.role === 'ARTIST') {
//     const artist = await Business.findOne({ auth: user._id });
//     stringLocation = artist?.stringLocation || '123 Main St, Springfield, IL';
//   }

//   if (user.role === 'BUSINESS') {
//     const business = await Business.findOne({ auth: user._id });
//     stringLocation = business?.stringLocation || '123 Main St, Springfield, IL';
//   }

//   // Prepare user data for tokens
//   const jwtPayload = {
//     id: userNewData._id.toString(),
//     fullName: userNewData.fullName,
//     phoneNumber: userNewData.phoneNumber,
//     stringLocation: stringLocation,
//     email: userNewData.email,
//     image: userNewData.image || defaultUserImage,
//     role: userNewData.role,
//     isProfile: userNewData?.isProfile,
//     isActive: user?.isActive,
//   };

//   const accessToken = createAccessToken(jwtPayload);

//   return {
//     accessToken,
//   };
// };

// 8. changePasswordIntoDB
// const changePasswordIntoDB = async (
//   payload: z.infer<typeof AuthValidation.changePasswordSchema.shape.body>,
//   userData: IAuth
// ) => {
//   const user = await Auth.findOne({ _id: userData._id, isActive: true }).select(
//     '+password'
//   );

//   if (!user) {
//     throw new AppError(httpStatus.NOT_FOUND, 'User not exists!');
//   }

//   if (user.isSocialLogin) {
//     throw new AppError(
//       httpStatus.NOT_FOUND,
//       "Social logged-in users don't have password to change!"
//     );
//   }

//   const isCredentialsCorrect = await user.isPasswordMatched(
//     payload.oldPassword
//   );

//   if (!isCredentialsCorrect) {
//     throw new AppError(
//       httpStatus.UNAUTHORIZED,
//       'Current password is not correct!'
//     );
//   }

//   user.password = payload.newPassword;
//   user.passwordChangedAt = new Date(Date.now() - 5000); // set 5 second before to avoid isJWTIssuedBeforePasswordChanged issue

//   await user.save();

//   let stringLocation: string = 'Not Set Yet';

//   if (user.role === 'CLIENT') {
//     const client = await Client.findOne({ auth: user._id });
//     stringLocation = client?.stringLocation || '123 Main St, Springfield, IL';
//   }

//   if (user.role === 'ARTIST') {
//     const artist = await Business.findOne({ auth: user._id });
//     stringLocation = artist?.stringLocation || '123 Main St, Springfield, IL';
//   }

//   if (user.role === 'BUSINESS') {
//     const business = await Business.findOne({ auth: user._id });
//     stringLocation = business?.stringLocation || '123 Main St, Springfield, IL';
//   }

//   // Prepare user data for tokens
//   const jwtPayload = {
//     id: user._id.toString(),
//     fullName: user.fullName,
//     phoneNumber: user.phoneNumber,
//     stringLocation: stringLocation,
//     email: user.email,
//     image: user.image || defaultUserImage,
//     role: user.role,
//     isProfile: user?.isProfile,
//     isActive: user?.isActive,
//   };

//   const accessToken = createAccessToken(jwtPayload);
//   const refreshToken = createRefreshToken(jwtPayload);

//   return {
//     accessToken,
//     refreshToken,
//   };
// };

// 9. forgotPassword
// const forgotPassword = async (email: string) => {
//   const user = await Auth.findOne({ email, isActive: true });

//   if (!user) {
//     throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
//   }

//   const now = new Date();

//   // If OTP exists and not expired, reuse it
//   if (user.otp && user.otpExpiry && now < user.otpExpiry) {
//     // Do nothing, just reuse existing OTP
//     const remainingMs = user.otpExpiry.getTime() - now.getTime();
//     const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));

//     // await sendOtpEmail(email, user.otp, user.fullName || 'Guest');

//     throw new AppError(
//       httpStatus.NOT_FOUND,
//       `Last OTP is valid till now, use that in ${remainingMinutes} minutes!`
//     );
//   } else {
//     // Generate new OTP
//     const otp = generateOtp();
//     const otpExpiry = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);

//     user.otp = otp;
//     user.otpExpiry = otpExpiry;
//     await user.save();

//     // Send OTP
//     await sendOtpEmail(email, otp, user.fullName || 'Guest');
//   }

//   // Issue token (just with email)
//   const token = jwt.sign({ email }, config.jwt.otp_secret!, {
//     expiresIn: config.jwt.otp_secret_expires_in!,
//   } as SignOptions);

//   return { token };
// };

// 9. sendForgotPasswordOtpAgain
// const sendForgotPasswordOtpAgain = async (forgotPassToken: string) => {
//   let decoded: any;
//   try {
//     decoded = jwt.verify(forgotPassToken, config.jwt.otp_secret!, {
//       ignoreExpiration: true,
//     });
//   } catch {
//     throw new AppError(httpStatus.BAD_REQUEST, 'Invalid token!');
//   }
//   const email = decoded.email;

//   if (!email) {
//     throw new AppError(httpStatus.BAD_REQUEST, 'Invalid token!');
//   }

//   const user = await Auth.findOne({ email, isActive: true });

//   if (!user) {
//     throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
//   }

//   const now = new Date();

//   // If OTP exists and not expired, reuse it
//   if (user.otp && user.otpExpiry && now < user.otpExpiry) {
//     // Do nothing, just reuse existing OTP
//     const remainingMs = user.otpExpiry.getTime() - now.getTime();
//     const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));

//     // await sendOtpEmail(email, user.otp, user.fullName || 'Guest');

//     throw new AppError(
//       httpStatus.NOT_FOUND,
//       `Last OTP is valid till now, use that in ${remainingMinutes} minutes!`
//     );
//   } else {
//     // Generate new OTP
//     const otp = generateOtp();
//     const otpExpiry = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);

//     user.otp = otp;
//     user.otpExpiry = otpExpiry;
//     await user.save();

//     // Send OTP
//     await sendOtpEmail(email, otp, user.fullName || 'Guest');
//   }

//   return null;
// };

// 10. verifyOtpForForgotPassword
// const verifyOtpForForgotPassword = async (payload: {
//   token: string;
//   otp: string;
// }) => {
//   let decoded: any;
//   try {
//     decoded = jwt.verify(payload.token, config.jwt.otp_secret!, {
//       ignoreExpiration: true,
//     });
//   } catch {
//     throw new AppError(httpStatus.BAD_REQUEST, 'Invalid token!');
//   }

//   const email = decoded.email;

//   const user = await Auth.findOne({ email, isActive: true });

//   if (!user) {
//     throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
//   }

//   // Check if OTP expired
//   if (!user.otp || !user.otpExpiry || Date.now() > user.otpExpiry.getTime()) {
//     // Generate and send new OTP
//     const newOtp = generateOtp();
//     const newExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

//     user.otp = newOtp;
//     user.otpExpiry = newExpiry;
//     await user.save();

//     await sendOtpEmail(email, newOtp, user.fullName || 'Guest');

//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       'OTP expired. A new OTP has been sent!'
//     );
//   }

//   // Check if OTP matches
//   if (user.otp !== payload.otp) {
//     throw new AppError(httpStatus.BAD_REQUEST, 'Invalid OTP!');
//   }

//   // OTP verified → issue reset password token
//   const resetPasswordToken = jwt.sign(
//     {
//       email: user.email,
//       isResetPassword: true,
//     },
//     config.jwt.otp_secret!,
//     { expiresIn: config.jwt.otp_secret_expires_in! } as SignOptions
//   );

//   return { resetPasswordToken };
// };

// 11. resetPasswordIntoDB
const resetPasswordIntoDB = async (
  resetPasswordToken: string,
  newPassword: string
) => {
  if (!resetPasswordToken) {
    throw new AppError(httpStatus.FORBIDDEN, 'Invalid reset password token!');
  }

  const payload = verifyToken(resetPasswordToken, config.jwt.otp_secret!) as {
    email: string;
    isResetPassword?: boolean;
  };

  if (!payload?.isResetPassword) {
    throw new AppError(httpStatus.FORBIDDEN, 'Invalid reset password token!');
  }

  const user = await Auth.findOne({ email: payload.email, isActive: true });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: true });

  return null;
};

// 12. fetchProfileFromDB
// const fetchProfileFromDB = async (user: IAuth) => {
//   if (user?.role === ROLE.CLIENT) {
//     const client = await Client.findOne({ auth: user._id }).populate([
//       {
//         path: 'auth',
//         select: 'fullName image email phoneNumber isProfile',
//       },
//     ]);
//     // .lean();

//     const preference = await ClientPreferences.findOne({
//       clientId: client?._id,
//     }).select('-clientId -updatedAt -createdAt');
//     // .lean();

//     // return { ...client, preference };
//     return { ...client?.toObject(), preference };
//   } else if (user?.role === ROLE.ARTIST) {
//     const artist = await Business.findOne({ auth: user._id }).populate([
//       {
//         path: 'auth',
//         select: 'fullName image email phoneNumber isProfile',
//       },
//       {
//         path: 'flashes.folder',
//       },
//       {
//         path: 'portfolio.folder',
//       },
//     ]);

//     const preference = await ArtistPreferences.findOne({
//       artistId: artist?._id,
//     }).select('-artistId -updatedAt -createdAt');

//     return { ...artist?.toObject(), preference };
//   } else if (user?.role === ROLE.BUSINESS) {
//     const business = await Business.findOne({ auth: user._id }).populate([
//       {
//         path: 'auth',
//         select: 'fullName image email phoneNumber isProfile',
//       },
//       {
//         path: 'residentArtists',
//         select: 'auth',
//         populate: {
//           path: 'auth',
//           select: 'fullName image email phoneNumber isProfile',
//         },
//       },
//     ]);

//     const preference = await BusinessPreferences.findOne({
//       businessId: business?._id,
//     }).select('-businessId -updatedAt -createdAt');

//     return { ...business?.toObject(), preference };
//   } else if (user?.role === ROLE.ADMIN || user?.role === ROLE.SUPER_ADMIN) {
//     return user;
//   }
// };

// 13. fetchAllConnectedAcount
// const fetchAllConnectedAcount = async (user: IAuth) => {
//   let currentUser;

//   if (user.role === ROLE.CLIENT) {
//     currentUser = await Client.findOne({ auth: user._id }).select('_id');
//   } else if (user.role === ROLE.BUSINESS) {
//     currentUser = await Business.findOne({ auth: user._id }).select('_id');
//   } else if (user.role === ROLE.ORGANIZATION) {
//     currentUser = await Organization.findOne({ auth: user._id }).select('_id');
//   }

//   if (!currentUser) {
//     throw new AppError(httpStatus.NOT_FOUND, 'Profile not found!');
//   }

//   const result = await ClientPreferences.findOne(
//     { clientId: currentUser._id },
//     { connectedAccounts: 1, _id: 0 } // projection
//   );

//   return result;
// };

// 14. deactivateUserAccountFromDB
const deactivateUserAccountFromDB = async (
  user: IAuth,
  payload: TDeactiveAccountPayload
) => {
  const { email, password, deactivationReason } = payload;

  const currentUser = await Auth.findOne({ _id: user._id, email: email });

  if (!currentUser) throw new AppError(httpStatus.NOT_FOUND, 'User not found!');

  const isPasswordCorrect = currentUser.isPasswordMatched(password);

  if (!isPasswordCorrect) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid credentials');
  }

  const result = await Auth.findByIdAndUpdate(
    user._id,
    {
      $set: {
        isDeactivated: true,
        deactivationReason: deactivationReason,
        deactivatedAt: new Date(),
      },
    },
    { new: true, select: 'email fullName isDeactivated deactivationReason' }
  );

  return result;
};

// 15. deleteSpecificUserAccount
// const deleteSpecificUserAccount = async (user: IAuth) => {
//   const session = await startSession();

//   try {
//     session.startTransaction();

//     const currentUser = await Auth.findById(user._id).session(session);
//     if (!currentUser)
//       throw new AppError(httpStatus.NOT_FOUND, 'User not found!');

//     currentUser.isDeleted = true;
//     currentUser.isDeactivated = false;
//     currentUser.isProfile = false;

//     if (user.role === ROLE.ARTIST || ROLE.BUSINESS) {
//       currentUser.isActive = false;
//     }
//     if (currentUser.deactivationReason) {
//       currentUser.deactivationReason = '';
//     }
//     await currentUser.save({ session });

//     if (user.role === ROLE.CLIENT) {
//       const client = await Client.findOne({ auth: user._id })
//         .select('_id')
//         .session(session);

//       if (client) {
//         const result = await Client.deleteOne({ _id: client._id }, { session });
//         if (result.deletedCount === 0)
//           throw new Error('Client deletion failed!');

//         const prefResult = await ClientPreferences.deleteOne(
//           { clientId: client._id },
//           { session }
//         );
//         if (prefResult.deletedCount === 0)
//           throw new Error('Client deletion failed here!');
//       }
//     } else if (user.role === ROLE.ARTIST) {
//       const artist = await Business.findOne({ auth: user._id })
//         .select('_id')
//         .session(session);

//       if (artist) {
//         const result = await Business.deleteOne(
//           { _id: artist._id },
//           { session }
//         );
//         if (result.deletedCount === 0)
//           throw new Error('Artist deletion failed!');
//         const prefResult = await ArtistPreferences.deleteOne(
//           { artistId: artist._id },
//           { session }
//         );
//         if (prefResult.deletedCount === 0)
//           throw new Error('Artist deletion failed here!');
//       }
//     } else if (user.role === ROLE.BUSINESS) {
//       const business = await Business.findOne({ auth: user._id })
//         .select('_id')
//         .session(session);

//       if (business) {
//         const result = await BusinessPreferences.deleteOne(
//           { businessId: business._id },
//           { session }
//         );
//         if (result.deletedCount === 0)
//           throw new Error('Business deletion failed!');
//         const prefResult = await Business.deleteOne(
//           { _id: business._id },
//           { session }
//         );
//         if (prefResult.deletedCount === 0)
//           throw new Error('Business deletion failed here!');
//       }
//     }

//     await session.commitTransaction();
//     await session.endSession();
//     return {
//       email: currentUser.email,
//       id: currentUser._id,
//       fullName: currentUser.fullName,
//     };
//   } catch (error) {
//     await session.abortTransaction();
//     await session.endSession();
//     throw error;
//   }
// };

// 16. getNewAccessTokenFromServer
// const getNewAccessTokenFromServer = async (refreshToken: string) => {
//   // checking if the given token is valid
//   const decoded = verifyToken(refreshToken, config.jwt.refresh_secret!) as any;

//   const { email, iat } = decoded;

//   // checking if the user is exist
//   const user = await Auth.isUserExistsByEmail(email);
//   if (!user) {
//     throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
//   }

//   // checking if the user is already deleted
//   const isDeleted = user?.isDeleted;
//   if (isDeleted) {
//     throw new AppError(httpStatus.FORBIDDEN, 'This account is deleted!');
//   }

//   // checking if the any hacker using a token even-after the user changed the password
//   if (
//     user.passwordChangedAt &&
//     user.isJWTIssuedBeforePasswordChanged(iat as number)
//   ) {
//     throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized!');
//   }

//   let stringLocation: string = 'Not Set Yet';

//   if (user.role === 'CLIENT') {
//     const client = await Client.findOne({ auth: user._id });
//     stringLocation = client?.stringLocation || '123 Main St, Springfield, IL';
//   }

//   if (user.role === 'ARTIST') {
//     const artist = await Business.findOne({ auth: user._id });
//     stringLocation = artist?.stringLocation || '123 Main St, Springfield, IL';
//   }

//   if (user.role === 'BUSINESS') {
//     const business = await Business.findOne({ auth: user._id });
//     stringLocation = business?.stringLocation || '123 Main St, Springfield, IL';
//   }

//   // Prepare user data for tokens
//   const jwtPayload = {
//     id: user?._id.toString(),
//     fullName: user?.fullName,
//     phoneNumber: user?.phoneNumber,
//     stringLocation: stringLocation,
//     email: user?.email,
//     image: user?.image || defaultUserImage,
//     role: user?.role,
//     isProfile: user?.isProfile,
//     isActive: user?.isActive,
//   };

//   const accessToken = createAccessToken(jwtPayload);

//   return {
//     accessToken,
//   };
// };

// 17. updateAuthDataIntoDB
// const updateAuthDataIntoDB = async (
//   payload: { fullName: string },
//   userData: IAuth
// ) => {
//   const user = await Auth.findByIdAndUpdate(
//     userData._id,
//     {
//       fullName: payload.fullName,
//     },
//     { new: true }
//   );

//   if (!user) {
//     throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
//   }

//   let stringLocation: string = 'Not Set Yet';

//   if (user.role === 'CLIENT') {
//     const client = await Client.findOne({ auth: user._id });
//     stringLocation = client?.stringLocation || '123 Main St, Springfield, IL';
//   }

//   if (user.role === 'ARTIST') {
//     const artist = await Business.findOne({ auth: user._id });
//     stringLocation = artist?.stringLocation || '123 Main St, Springfield, IL';
//   }

//   if (user.role === 'BUSINESS') {
//     const business = await Business.findOne({ auth: user._id });
//     stringLocation = business?.stringLocation || '123 Main St, Springfield, IL';
//   }

//   // Prepare user data for tokens
//   const jwtPayload = {
//     id: user._id.toString(),
//     fullName: user.fullName,
//     phoneNumber: user.phoneNumber,
//     stringLocation: stringLocation,
//     email: user.email,
//     image: user.image || defaultUserImage,
//     role: user.role,
//     isProfile: user?.isProfile,
//     isActive: user?.isActive,
//   };

//   const accessToken = createAccessToken(jwtPayload);

//   return {
//     accessToken,
//   };
// };

// 18. updateFcmTokenIntoDB
const updateFcmTokenIntoDB = async (
  payload: { userId: string; fcmToken: string },
  userData: IAuth
) => {
  if (userData._id.toString() !== payload.userId) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Bad request!');
  }

  const user = await Auth.findByIdAndUpdate(
    userData._id,
    {
      fcmToken: payload.fcmToken,
    },
    { new: true }
  );

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found!');
  }

  return null;
};

// 19. getUserForConversationFromDB
const getUserForConversationFromDB = async (
  searchTerm: string,
  currentUserId: string // to exclude current user
) => {
  // 🧩 Validation
  if (!searchTerm || searchTerm.trim().length < 1) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Search term is required');
  }

  // 🧩 Build query: case-insensitive partial match on name or email
  const regex = new RegExp(searchTerm.trim(), 'i');

  // 🧩 Find matching users
  const users = await Auth.find({
    $and: [
      { _id: { $ne: currentUserId } }, // exclude self
      {
        $or: [{ name: regex }, { email: regex }],
      },
    ],
  })
    .select('_id fullName email image') // exclude sensitive fields
    .limit(20)
    .lean();

  // 🧩 Optional: handle no results
  if (!users || users.length === 0) {
    return [];
  }

  return users;
};

export const AuthService = {
  createAuthIntoDB,
  sendSignupOtpAgain,
  // verifySignupOtpIntoDB,
  // signinIntoDB,
  // createProfileIntoDB,
  // checkProfileStatusIntoDB,
  // clientCreateProfileIntoDB,
  // artistCreateProfileIntoDB,
  // businessCreateProfileIntoDB,
  // socialLoginServices,
  // updateProfilePhotoIntoDB,
  // changePasswordIntoDB,
  // forgotPassword,
  // sendForgotPasswordOtpAgain,
  // verifyOtpForForgotPassword,
  resetPasswordIntoDB,
  // fetchProfileFromDB,
  // fetchAllConnectedAcount,
  deactivateUserAccountFromDB,
  // deleteSpecificUserAccount,
  // getNewAccessTokenFromServer,
  // updateAuthDataIntoDB,
  updateFcmTokenIntoDB,
  getUserForConversationFromDB,
};
