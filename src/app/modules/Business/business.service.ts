/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'fs';
import httpStatus from 'http-status';
import { startSession, Types } from 'mongoose';
import { TAvailability } from '../../schema/slotValidation';
import { AppError } from '../../utils';
import { IAuth } from '../Auth/auth.interface';
import Auth from '../Auth/auth.model';
import { IBusiness } from './business.interface';
import Business from './business.model';
import {
  TSetOffDays,
  TUpdateArtistNotificationPayload,
  TUpdateArtistPayload,
  TUpdateArtistPreferencesPayload,
  TUpdateArtistPrivacySecurityPayload,
  TUpdateArtistProfilePayload,
} from './business.validation';
import { JwtPayload } from 'jsonwebtoken';
import Stripe from 'stripe';
import config from '../../config';
import Notification from '../Notification/notification.model';

const stripe = new Stripe(config.stripe.stripe_secret_key as string);

// getAllArtistsFromDB
const getAllArtistsFromDB = async (
  query: Record<string, any>,
  userData: IAuth
) => {
  const loggedInArtist = await Business.findOne({ auth: userData._id });

  if (!loggedInArtist || !loggedInArtist.currentLocation) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Logged in artist location not found!'
    );
  }

  const [lon, lat] = loggedInArtist.currentLocation.coordinates;

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  // Filter artists with valid coordinates first, excluding logged-in artist
  // const artistsWithLocation = await Artist.find({
  //   'currentLocation.coordinates.0': { $exists: true },
  //   'currentLocation.coordinates.1': { $exists: true },
  //   auth: { $ne: userData._id }, // exclude logged-in artist
  // }).countDocuments();

  // searchFilter
  const searchFilter: Record<string, any> = {
    'currentLocation.coordinates.0': { $exists: true },
    'currentLocation.coordinates.1': { $exists: true },
    // auth: { $ne: userData._id }, // exclude logged-in artist
  };

  // Add searchTerm filter (on stringLocation OR expertise)
  if (query.searchTerm) {
    searchFilter.$or = [
      {
        stringLocation: {
          $regex: query.searchTerm,
          $options: 'i',
        },
      },
      {
        expertise: {
          $elemMatch: { $regex: query.searchTerm, $options: 'i' },
        },
      },
    ];
  }

  // Geo query with pagination, excluding logged-in artist
  const artists = await Business.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [lon, lat] },
        distanceField: 'distance', // distance in meters
        spherical: true,
        query: searchFilter, // nice to use
      },
    },
    {
      $lookup: {
        from: 'auths',
        localField: 'auth',
        foreignField: '_id',
        as: 'auth',
      },
    },
    { $unwind: '$auth' },
    {
      $project: {
        expertise: 1,
        currentLocation: 1,
        stringLocation: 1,
        distance: 1,
        avgRating: 1,
        totalReviewCount: 1,
        hourlyRate: 1,
        totalCompletedService: 1,
        // Only these fields from auth
        'auth._id': 1,
        'auth.fullName': 1,
        'auth.phoneNumber': 1,
        'auth.email': 1,
        'auth.image': 1,
      },
    },
    { $skip: skip },
    { $limit: limit },
  ]);

  return {
    data: artists,
    meta: {
      total: artists.length,
      // total: artistsWithLocation,
      totalPage: Math.ceil(artists?.length / limit),
      // totalPage: Math.ceil(artistsWithLocation / limit),
      limit,
      page,
    },
  };
};

// getOwnArtistDataFromDB
const getOwnArtistDataFromDB = async (userData: IAuth) => {
  const artist = await Business.findOne({ auth: userData._id });

  if (!artist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist not found!');
  }

  const services = await Service.find({ artist: artist._id }).lean();

  return { artist, services };
};

// getSingleArtistFromDB
const getSingleArtistFromDB = async (artistId: string) => {
  const artist = await Business.findById(artistId);

  if (!artist) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Logged in artist location not found!'
    );
  }

  return artist;
};

// update artist person info into db
const updateArtistPersonalInfoIntoDB = async (
  user: IAuth,
  payload: TUpdateArtistPayload
) => {
  const artist = await Business.findOne({ auth: user._id });

  if (!artist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist not found!');
  }

  await ArtistPreferences.findOneAndUpdate({ artistId: artist._id }, payload, {
    new: true,
  });

  return await Business.findOneAndUpdate({ auth: user._id }, payload, {
    new: true,
  }).populate('preferences');
};

// updateArtistProfileIntoDB
const updateArtistProfileIntoDB = async (
  user: IAuth,
  payload: TUpdateArtistProfilePayload
) => {
  const artist = await Business.findOne({ auth: user._id });

  if (!artist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist not found!');
  }

  const updatedArtist = await Auth.findByIdAndUpdate(user._id, payload);

  if (!updatedArtist?.isModified) {
    throw new AppError(httpStatus.NOT_FOUND, 'Failed to update artist!');
  }

  const result = await Business.findOne({ auth: user._id })
    .select('_id')
    .populate({
      path: 'auth',
      select: 'fullName',
    });

  return result;
};

// updateArtistPreferencesIntoDB
const updateArtistPreferencesIntoDB = async (
  user: IAuth,
  payload: TUpdateArtistPreferencesPayload
) => {
  const artist = await Business.findOne({
    auth: user._id,
  });

  if (!artist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist not found!');
  }

  const artistPreferences = await ArtistPreferences.findOne({
    artistId: artist._id,
  });

  if (!artistPreferences) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist preferences not found!');
  }

  Object.assign(artistPreferences, payload);
  await artistPreferences.save();

  return artistPreferences;
};

// updateArtistNotificationPreferencesIntoDB
const updateArtistNotificationPreferencesIntoDB = async (
  user: IAuth,
  payload: TUpdateArtistNotificationPayload
) => {
  const artist = await Business.findOne({
    auth: user._id,
  });

  if (!artist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist not found!');
  }

  const artistPreferences = await ArtistPreferences.findOne({
    artistId: artist._id,
  });

  if (!artistPreferences) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist preferences not found!');
  }

  Object.assign(artistPreferences, payload);
  await artistPreferences.save();

  return artistPreferences;
};

// updateArtistPrivacySecuritySettingsIntoDB
const updateArtistPrivacySecuritySettingsIntoDB = async (
  user: IAuth,
  payload: TUpdateArtistPrivacySecurityPayload
) => {
  const artist = await Business.findOne({
    auth: user._id,
  });

  if (!artist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist not found!');
  }

  const artistPreferences = await ArtistPreferences.findOne({
    artistId: artist._id,
  });

  if (!artistPreferences) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist preferences not found!');
  }

  Object.assign(artistPreferences, payload);
  await artistPreferences.save();

  return artistPreferences;
};

// updateArtistFlashesIntoDB
const updateArtistFlashesIntoDB = async (
  user: IAuth,
  files: Express.Multer.File[] | undefined
) => {
  const artist = await Business.findOne({
    auth: user._id,
  });

  if (!artist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist not found!');
  }

  if (!files || !files?.length) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Files are required!');
  }

  return await Business.findByIdAndUpdate(
    artist._id,
    {
      $push: {
        flashes: { $each: files.map((file) => file.path.replace(/\\/g, '/')) },
      },
    },
    { new: true }
  );
};

// updateArtistPortfolioIntoDB
const updateArtistPortfolioIntoDB = async (
  user: IAuth,
  files: Express.Multer.File[] | undefined
) => {
  const artist = await Business.findOne({
    auth: user._id,
  });

  if (!artist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist not found!');
  }

  // if (!artist.isVerifiedByOTP) {
  //   throw new AppError(httpStatus.BAD_REQUEST, 'Artist not verified');
  // }

  // if (!artist.isActive) {
  //   throw new AppError(httpStatus.BAD_REQUEST, 'Artist not activated by admin yet');
  // }

  if (!files || !files?.length) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Files are required');
  }

  return await Business.findByIdAndUpdate(
    artist._id,
    {
      $push: {
        portfolio: {
          $each: files.map((file) => file.path.replace(/\\/g, '/')),
        },
      },
    },
    { new: true }
  );
};

// addArtistServiceIntoDB
// const addArtistServiceIntoDB = async (
//   user: IAuth,
//   payload: TServicePayload,
//   files: TServiceImages
// ): Promise<IService> => {
//   const artist = await Artist.findOne({ auth: user._id });
//   if (!artist) {
//     throw new AppError(httpStatus.BAD_REQUEST, 'Artist not found!');
//   }

//   const thumbnail = files?.thumbnail[0]?.path.replace(/\\/g, '/') || '';
//   const images = files?.images?.map(
//     (image) => image.path.replace(/\\/g, '/') || ''
//   );

//   const totalDurationInMinutes = parseDurationToMinutes(payload.totalDuration);
//   const sessionInMinutes = parseDurationToMinutes(payload.sessionDuration);
//   const numberOfSessions = Math.ceil(totalDurationInMinutes / sessionInMinutes);

//   const serviceData = {
//     ...payload,
//     artist: artist._id,
//     totalDurationInMin: totalDurationInMinutes,
//     sessionDurationInMin: sessionInMinutes,
//     numberOfSessions: numberOfSessions,
//     thumbnail: thumbnail,
//     images: images,
//   };

//   const service = await Service.create(serviceData);
//   return service;
// };

// getServicesByArtistFromDB
const getServicesByArtistFromDB = async (user: IAuth) => {
  const artist = await Business.findOne({ auth: user._id });
  if (!artist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist not found!');
  }

  const result = await Service.aggregate([
    { $match: { artist: artist._id } },

    {
      $project: {
        avgRating: 1,
        bodyLocation: 1,
        description: 1,
        images: 1,
        price: 1,
        sessionType: 1,
        thumbnail: 1,
        title: 1,
        // totalCompletedOrder: 1,
        // totalReviewCount: 1,
        _id: 1,
      },
    },
  ]);

  return result;
};

// updateArtistServiceByIdIntoDB
const updateArtistServiceByIdIntoDB = async (
  id: string,
  payload: Partial<IService>,
  files: TServiceImages,
  UserData: IAuth
) => {
  const artist = await Business.findOne({ auth: UserData._id });
  if (!artist) {
    deleteSomeMulterFiles([
      ...(files?.thumbnail || []),
      ...(files?.images || []),
    ]);

    throw new AppError(httpStatus.NOT_FOUND, 'Your artist account not found!');
  }

  const service = await Service.findOne({ _id: id, artist: artist._id });
  if (!service) {
    deleteSomeMulterFiles([
      ...(files?.thumbnail || []),
      ...(files?.images || []),
    ]);

    throw new AppError(httpStatus.NOT_FOUND, 'Service not found!');
  }

  // Handle thumbnail
  let thumbnail = service.thumbnail;
  if (files?.thumbnail && files.thumbnail.length > 0) {
    thumbnail = files.thumbnail[0].path.replace(/\\/g, '/');
    deleteSingleImage(service.thumbnail);
  }

  // Handle images (merge old + new)
  let images: string[] = payload.images || service.images || [];
  if (files?.images && files.images.length > 0) {
    const newImages = files.images.map((img) => img.path.replace(/\\/g, '/'));
    images = [...images, ...newImages];
  }

  // Find removed images (present in old service.images but not in payload.images)
  const removedImages: string[] = service.images.filter(
    (img) => !(payload.images || []).includes(img)
  );

  // Delete removed images from storage
  if (removedImages.length > 0) {
    deleteSomeImages(removedImages);
  }

  // Validate images length (2-5)
  if (images.length < 2 || images.length > 5) {
    deleteSomeMulterFiles([
      ...(files?.thumbnail || []),
      ...(files?.images || []),
    ]);

    throw new AppError(
      httpStatus.BAD_REQUEST,
      'You must upload between 2 and 5 Service Images!'
    );
  }

  const serviceData = {
    ...payload,
    thumbnail,
    images,
  };

  const result = await Service.findByIdAndUpdate(id, serviceData, {
    new: true,
  });

  if (!result) {
    deleteSomeMulterFiles([
      ...(files?.thumbnail || []),
      ...(files?.images || []),
    ]);

    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to update service!');
  }

  return result;
};

// deleteArtistServiceFromDB
const deleteArtistServiceFromDB = async (id: string, UserData: IAuth) => {
  const artist = await Business.findOne({ auth: UserData._id });

  if (!artist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Your artist account not found!');
  }

  const serviceExists = await Service.find({ _id: id, artist: artist._id });

  if (!serviceExists) {
    throw new AppError(httpStatus.NOT_FOUND, 'Service not found!');
  }

  await Service.findByIdAndUpdate(id, { isDeleted: true }, { new: true });

  return null;
};

// removeImageFromDB
const removeImageFromDB = async (user: IAuth, filePath: string) => {
  const artist = await Business.findOne({
    auth: user._id,
  });

  if (!artist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist not found!');
  }

  // Remove the image file path from the 'flashes' array
  const updatedArtist = await Business.findByIdAndUpdate(
    artist._id,
    {
      $pull: {
        flashes: filePath,
        portfolio: filePath,
      },
    },
    { new: true }
  );

  if (!updatedArtist) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to remove flash image'
    );
  }

  // Check if the file exists and delete it
  fs.unlink(filePath, () => {});

  return updatedArtist;
};

// update time off
const setArtistTimeOffIntoDB = async (user: IAuth, payload: TSetOffDays) => {
  const artist = await Business.findOne({ auth: user._id }).select('_id');
  if (!artist) throw new AppError(httpStatus.NOT_FOUND, 'Artist not found');

  const { startDate, endDate } = payload;

  if (endDate <= startDate) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'End date must be after start date'
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const schedule = await ArtistSchedule.findOne({ _id: artist._id });
  if (!schedule)
    throw new AppError(httpStatus.NOT_FOUND, 'Artist schedule not found');

  const existing = schedule.offDays;

  /**
   * Case 1: offDays already active (ongoing right now)
   */
  if (
    existing?.startDate &&
    existing.startDate < today &&
    existing.endDate &&
    today <= existing.endDate
  ) {
    if (endDate <= existing.endDate) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'End date must extend current Off Days'
      );
    }

    const hasBookings = await Booking.exists({
      artist: artist._id,
      originalDate: { $gte: existing.endDate, $lt: endDate },
      status: { $in: ['pending', 'confirmed'] },
    });

    if (hasBookings) {
      throw new AppError(
        httpStatus.CONFLICT,
        'Cannot extend Off Days — bookings exist in new range'
      );
    }

    schedule.offDays.endDate = endDate;
    await schedule.save();
    return schedule.offDays;
  }

  /**
   * Case 2: Old offDays expired — override if no conflicts
   */
  if (existing?.endDate && existing.endDate < today) {
    const hasBookings = await Booking.exists({
      artist: artist._id,
      originalDate: { $gte: startDate, $lt: endDate },
      status: { $in: ['pending', 'confirmed'] },
    });

    if (hasBookings) {
      throw new AppError(
        httpStatus.CONFLICT,
        'Cannot override expired Off Days — bookings exist in new period'
      );
    }

    schedule.offDays = { startDate, endDate };
    await schedule.save();
    return schedule.offDays;
  }

  /**
   * Case 3: New future offDays
   */
  if (startDate < today) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Start date cannot be in the past'
    );
  }

  const hasBookings = await Booking.exists({
    artist: artist._id,
    originalDate: { $gte: startDate, $lt: endDate },
    status: { $in: ['pending', 'confirmed'] },
  });

  if (hasBookings) {
    throw new AppError(
      httpStatus.CONFLICT,
      'Cannot set Off Days — bookings exist in this period'
    );
  }

  schedule.offDays = { startDate, endDate };
  await schedule.save();
  return schedule.offDays;
};

const getArtistMonthlySchedule = async (
  user: IAuth,
  year: number,
  month: number
) => {
  // Month boundaries

  const artist = await Business.findOne({ auth: user.id }, '_id');
  if (!artist) throw new AppError(httpStatus.NOT_FOUND, 'artist not found');
  const startOfMonth = new Date(year, month - 1, 1); // 2025-05-01
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999); // 2025-05-31

  const result = await Booking.aggregate([
    // 1. Filter artist bookings with valid status and sessions in month
    {
      $match: {
        artist: new Types.ObjectId(artist._id),
        status: { $in: ['confirmed', 'in_progress', 'ready_for_completion'] },
        'sessions.date': { $gte: startOfMonth, $lte: endOfMonth },
      },
    },

    // 2. Only keep necessary fields
    {
      $project: {
        _id: 1,
        clientInfo: { fullName: 1, phone: 1, email: 1 },
        service: 1,
        sessions: 1,
      },
    },

    // 3. Unwind sessions
    { $unwind: '$sessions' },

    // 4. Match only sessions within month
    {
      $match: {
        'sessions.date': { $gte: startOfMonth, $lte: endOfMonth },
      },
    },

    // 5. Lookup service info
    {
      $lookup: {
        from: 'services',
        localField: 'service',
        foreignField: '_id',
        pipeline: [{ $project: { _id: 1, title: 1 } }],
        as: 'service',
      },
    },
    { $unwind: '$service' },

    // 6. Project only needed fields per session
    {
      $project: {
        bookingId: '$_id',
        sessionId: '$sessions._id',
        date: '$sessions.date',
        startTime: '$sessions.startTime',
        endTime: '$sessions.endTime',
        status: '$sessions.status',
        service: { _id: '$service._id', name: '$service.title' },
        client: '$clientInfo',
      },
    },

    // 7. Group by day
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        sessions: { $push: '$$ROOT' },
      },
    },

    // 8. Sort by date
    { $sort: { _id: 1 } },
  ]);

  // Convert _id to date key
  const grouped: Record<string, any[]> = {};
  result.forEach((day) => {
    grouped[day._id] = day.sessions;
  });

  return grouped;
};

// createConnectedAccountAndOnboardingLinkForArtistIntoDb
const createConnectedAccountAndOnboardingLinkForArtistIntoDb = async (
  userData: JwtPayload
) => {
  try {
    // Step 1: Find Artist
    const artist = await Business.findOne(
      { auth: userData._id },
      { _id: 1, stripeAccountId: 1, isStripeReady: 1, auth: 1 }
    ).populate('auth');

    if (!artist) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        'Artist not found or restricted.'
      );
    }

    // Step 2: If Stripe account exists but not ready yet
    if (artist.stripeAccountId && !artist.isStripeReady) {
      const account = await stripe.accounts.retrieve(artist.stripeAccountId);

      const isStripeFullyOk =
        account?.capabilities?.card_payments === 'active' &&
        account?.capabilities?.transfers === 'active';

      if (isStripeFullyOk) {
        // Mark artist as Stripe ready
        artist.isStripeReady = true;
        await artist.save();

        return null; // Already ready, no need for onboarding link
      }

      // Generate new onboarding link for existing account
      const onboardingData = await stripe.accountLinks.create({
        account: artist.stripeAccountId,
        refresh_url: `${config.stripe.onboarding_refresh_url}?accountId=${artist.stripeAccountId}`,
        return_url: config.stripe.onboarding_return_url,
        type: 'account_onboarding',
      });

      return onboardingData.url;
    }

    // Step 3: If no Stripe account, create a new one
    if (!artist.stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: (artist?.auth as any)?.email,
        country: 'US',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        settings: {
          payouts: { schedule: { interval: 'manual' } },
        },
      });

      const onboardingData = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${config.stripe.onboarding_refresh_url}?accountId=${account.id}`,
        return_url: config.stripe.onboarding_return_url,
        type: 'account_onboarding',
      });

      const updatedArtist = await Business.findByIdAndUpdate(
        artist._id,
        { $set: { stripeAccountId: account.id, isStripeReady: false } },
        { new: true }
      );

      if (!updatedArtist) {
        await stripe.accounts.del(account.id); // cleanup

        throw new AppError(
          httpStatus.NOT_EXTENDED,
          'Failed to save Stripe account ID into DB!'
        );
      }

      return onboardingData.url;
    }

    return null; // Fallback
  } catch (error) {
    console.error('Stripe Onboarding Error:', error);
    throw new AppError(
      httpStatus.SERVICE_UNAVAILABLE,
      'Stripe onboarding service unavailable'
    );
  }
};
// create service
const createService = async (
  user: IAuth,
  payload: TServicePayload,
  files: TServiceImages
): Promise<IService> => {
  const artist = await Business.findOne({ auth: user._id });
  if (!artist) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Artist not found!');
  }

  const thumbnail = files?.thumbnail[0]?.path.replace(/\\/g, '/') || '';
  const images =
    files?.images?.map((image) => image.path.replace(/\\/g, '/') || '') || [];

  // Validate images length (2-5)
  if (images.length < 2 || images.length > 5) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'You must upload between 2 and 5 Service Images!'
    );
  }

  const serviceData = {
    ...payload,
    artist: artist._id,
    thumbnail,
    images,
  };

  const service = await Service.create(serviceData);
  return service;
};

const boostProfileIntoDb = async (user: IAuth) => {
  const session = await startSession();
  session.startTransaction();

  try {
    const artist = await Business.findOne(
      { auth: user.id },
      '_id boost'
    ).session(session);
    if (!artist) throw new AppError(httpStatus.NOT_FOUND, 'artist not found');

    const boost = await ArtistBoost.create(
      [
        {
          artist: artist._id,
          paymentStatus: 'pending',
          charge: Number(config.boost_charge),
          startTime: new Date(),
          endTime: new Date(Date.now() + 12 * 60 * 60 * 1000),
        },
      ],
      { session }
    );

    // create checkout session
    const checkoutSession: any = await stripe.checkout.sessions.create(
      {
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: { name: 'Profile Boost' },
              unit_amount: Math.round(Number(config.boost_charge) * 100),
            },
            quantity: 1,
          },
        ],
        expand: ['payment_intent'],
        metadata: {
          boostId: boost[0]?._id?.toString(),
          artistId: artist._id.toString(),
        },
        success_url: `${process.env.CLIENT_URL}/boost/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_URL}/boost/cancel`,
      },
      { idempotencyKey: `boost_${boost[0].id.toString()}` }
    );
    // save boost record in DB (pending)
    boost[0].paymentStatus = 'succeeded';
    await boost[0].save({ session });
    await session.commitTransaction();
    session.endSession();

    return checkoutSession.url;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

// expire boost
export const expireBoosts = async () => {
  const now = new Date();

  // find boosts that are still active and past endTime
  const expiredBoosts = await ArtistBoost.find({
    endTime: { $lte: now },
    isActive: true,
  });

  if (expiredBoosts.length === 0) return; // nothing to do

  for (const boost of expiredBoosts) {
    boost.isActive = false;
    await boost.save();

    // update the artist's boost info
    await Business.findByIdAndUpdate(boost.artist, {
      'boost.isActive': false,
      'boost.endTime': boost.endTime,
    });
  }
};

const getArtistDashboardPage = async (user: IAuth) => {
  const artist = await Business.findOne({ auth: user.id }).select('_id');
  if (!artist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist not found');
  }

  // Step 2: aggregate booking stats for this artist
  const [bookingStats] = await Booking.aggregate([
    {
      $match: {
        artist: artist._id,
      },
    },
    {
      $group: {
        _id: null,
        pendingBooking: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
        },
        currentBooking: {
          $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] },
        },
        completedOrder: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
        },
        artistEarning: {
          $sum: {
            $cond: [{ $eq: ['$status', 'completed'] }, '$artistEarning', 0],
          },
        },
      },
    },
  ]);

  const totalServices = await Service.countDocuments({ artist: artist._id });

  const latestBookings = await Booking.find({
    artist: artist._id,
    status: 'pending',
  })
    .select('clientInfo.fullName createdAt serviceName') // only include client's fullName
    .sort({ createdAt: -1 })
    .limit(2)
    .lean(); // <-- returns plain JSON instead of mongoose docs

  // reshape result
  const latestBookingRequest = latestBookings.map((b) => ({
    _id: b._id,
    FullName: b.clientInfo?.fullName || null,
    serviceName: b.serviceName,
    image: user.image,
    createdAt: b.createdAt,
  }));

  // Step 5: latest 2 notifications for artist
  const latestNotificationsRaw = await Notification.find({
    receiver: user.id,
  })
    .select('type createdAt receiver')
    .populate<{ receiver: IAuth }>('receiver', 'fullName')
    .sort({ createdAt: -1 })
    .limit(2)
    .lean();

  console.log('notification', latestNotificationsRaw);
  const latestNotifications = latestNotificationsRaw.map((n) => ({
    _id: n._id,
    type: n.type,
    createdAt: n.createdAt,
    receiverName: n.receiver?.fullName || null,
  }));
  // Step 4: final response
  return {
    pendingBooking: bookingStats?.pendingBooking || 0,
    currentBooking: bookingStats?.currentBooking || 0,
    completedOrder: bookingStats?.completedOrder || 0,
    artistEarning: bookingStats?.artistEarning || 0,
    totalService: totalServices,
    latestBookingRequest: latestBookingRequest,
    latestNotifications: latestNotifications,
  };
};

export const BusinessService = {
  getAllArtistsFromDB,
  getOwnArtistDataFromDB,
  getSingleArtistFromDB,
  updateArtistPersonalInfoIntoDB,
  updateArtistProfileIntoDB,
  updateArtistPreferencesIntoDB,
  updateArtistNotificationPreferencesIntoDB,
  updateArtistPrivacySecuritySettingsIntoDB,
  updateArtistFlashesIntoDB,
  updateArtistPortfolioIntoDB,
  getArtistMonthlySchedule,
  boostProfileIntoDb,
  getArtistDashboardPage,
  // addArtistServiceIntoDB,
  getServicesByArtistFromDB,
  updateArtistServiceByIdIntoDB,
  deleteArtistServiceFromDB,
  removeImageFromDB,
  setArtistTimeOffIntoDB,
  createConnectedAccountAndOnboardingLinkForArtistIntoDb,
  createService,
};
