/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import mongoose, { startSession } from 'mongoose';
import { AppError } from '../../utils';
import Business from '../Business/business.model';
import { IAuth } from '../Auth/auth.interface';
import Auth from '../Auth/auth.model';
import { TUpdateBusinessProfilePayload } from './organization.validation';

// Update Business Profile
const updateBusinessProfile = async (
  user: IAuth,
  payload: TUpdateBusinessProfilePayload
) => {
  const business = await Business.findOne({ auth: user._id });

  if (!business) {
    throw new AppError(httpStatus.NOT_FOUND, 'Business not found!');
  }

  const session = await startSession();

  try {
    session.startTransaction();

    // Update Auth data with new business details
    await Auth.findByIdAndUpdate(user._id, payload, { session });

    // Update Business data with new business details
    const updatedBusiness = await Business.findOneAndUpdate(
      { auth: user._id },
      {
        studioName: payload.studioName,
        businessType: payload.businessType,
        country: payload.country,
      },
      { new: true, session }
    ).populate([
      {
        path: 'auth',
        select: 'fullName email phoneNumber',
      },
    ]);

    await session.commitTransaction();
    await session.endSession();

    return updatedBusiness;
  } catch {
    await session.abortTransaction();
    await session.endSession();
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Something went wrong while updating business profile data'
    );
  }
};

const getBusinessArtists = async (
  user: IAuth,
  query: Record<string, any> = {}
) => {
  const page = Number(query.page) > 0 ? Number(query.page) : 1;
  const limit = Number(query.limit) > 0 ? Number(query.limit) : 10;
  const skip = (page - 1) * limit;

  const business = await Business.findOne({ auth: user._id });
  if (!business)
    throw new AppError(httpStatus.BAD_REQUEST, 'business not found');

  const pipeline: any[] = [
    {
      $match: {
        business: new mongoose.Types.ObjectId(business._id),
        isConnBusiness: true,
      },
    },

    // 🔹 Lookup artist auth info
    {
      $lookup: {
        from: 'auths',
        localField: 'auth',
        foreignField: '_id',
        as: 'artistAuth',
      },
    },
    { $unwind: '$artistAuth' },

    // 🔹 Lookup business info
    {
      $lookup: {
        from: 'businesses',
        localField: 'business',
        foreignField: '_id',
        as: 'businessInfo',
      },
    },
    { $unwind: '$businessInfo' },

    // 🔹 Final projection
    {
      $project: {
        _id: 1,
        fullName: '$artistAuth.fullName',
        email: '$artistAuth.email',
        phone: '$artistAuth.phone',
        // city: 1,
        stringLocation: 1,
        avgRating: 1,
        portfolio: 1,
        flashes: 1,
      },
    },

    // Pagination
    { $skip: skip },
    { $limit: limit },
  ];

  const data = await Business.aggregate(pipeline);

  // total count (without pagination)
  const total = await Business.countDocuments({
    business: business._id,
    isConnBusiness: true,
  });

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
  };
};

// removeArtistFromDB
const removeArtistFromDB = async (user: IAuth, artistId: string) => {
  const business = await Business.findOne({ auth: user._id });

  if (!business) {
    throw new AppError(httpStatus.NOT_FOUND, 'Artist not found!');
  }

  return await Business.findByIdAndUpdate(
    business._id,
    { $pull: { residentArtists: artistId } },
    { new: true }
  );
};

export const BusinessService = {
  updateBusinessProfile,

  // updateGuestSpotsIntoDB,
  getBusinessArtists,
  removeArtistFromDB,
};
