// import httpStatus from 'http-status';
// import { AppError } from '../../utils';
// import Business from '../Business/business.model';
// import { IAuth } from '../Auth/auth.interface';
// import Auth from '../Auth/auth.model';
// import Client from './client.model';
// import {
//   TUpdateNotificationPayload,
//   TUpdatePreferencePayload,
//   TUpdateProfilePayload,
//   TUpdateSecuritySettingsPayload,
// } from './client.validation';

// // updateProfile
// const updateProfile = async (user: IAuth, payload: TUpdateProfilePayload) => {
//   const result = await Auth.findByIdAndUpdate(user._id, payload, {
//     new: true,
//     select: 'fullName',
//   });
//   return result;
// };

// // updatePreferences
// const updatePreferences = async (
//   user: IAuth,
//   payload: TUpdatePreferencePayload
// ) => {
//   // Find the client using the auth user_id
//   const client = await Client.findOne({ auth: user._id });
//   if (!client) {
//     throw new AppError(httpStatus.NOT_FOUND, 'Client not found!');
//   }

//   const result = await Client.findByIdAndUpdate(client._id, payload, {
//     new: true,
//   });

//   // Find and update preferences, or create new ones if not found
//   if (!result) {
//     throw new AppError(
//       httpStatus.INTERNAL_SERVER_ERROR,
//       'Error updating preferences'
//     );
//   }

//   return result;
// };

// // updateNotificationPreferences
// // const updateNotificationPreferences = async (
// //   user: IAuth,
// //   payload: TUpdateNotificationPayload
// // ) => {
// //   // Step 1: Find the client
// //   const client = await Client.findOne({ auth: user._id });
// //   if (!client) {
// //     throw new AppError(httpStatus.NOT_FOUND, 'Client not found!');
// //   }

// //   const updateData = payload.all
// //     ? {
// //         bookingConfirmations: true,
// //         bookingReminders: true,
// //         bookingCancellations: true,
// //         newMessageNotifications: true,
// //         appUpdates: true,
// //         newAvailability: true,
// //         lastMinuteBookings: true,
// //         newGuestArtists: true,
// //       }
// //     : {
// //         bookingConfirmations: payload.bookingConfirmations,
// //         bookingReminders: payload.bookingReminders,
// //         bookingCancellations: payload.bookingCancellations,
// //         newMessageNotifications: payload.newMessageNotifications,
// //         appUpdates: payload.appUpdates,
// //         newAvailability: payload.newAvailability,
// //         lastMinuteBookings: payload.lastMinuteBookings,
// //         newGuestArtists: payload.newGuestArtists,
// //         notificationPreferences: payload.notificationPreferences,
// //       };

// //   // Step 2: Find and update the client's notification preferences
// //   const preferences = await ClientPreferences.findOneAndUpdate(
// //     { clientId: client._id },
// //     updateData,
// //     { new: true }
// //   );

// //   if (!preferences) {
// //     throw new AppError(
// //       httpStatus.NOT_FOUND,
// //       'Preferences not found for this client'
// //     );
// //   }

// //   // Return the updated preferences
// //   return updateData;
// // };

// // updatePrivacySecuritySettings
// // const updatePrivacySecuritySettings = async (
// //   user: IAuth,
// //   payload: TUpdateSecuritySettingsPayload
// // ) => {
// //   const client = await Client.findOne({ auth: user._id }).select('_id');
// //   if (!client) {
// //     throw new AppError(httpStatus.NOT_FOUND, 'Client not found!');
// //   }

// //   const updatedPreferences = await ClientPreferences.findOneAndUpdate(
// //     { clientId: client._id },
// //     { $set: payload },
// //     {
// //       new: true,
// //       projection: {
// //         twoFactorAuthEnabled: 1,
// //         locationSuggestions: 1,
// //         personalizedContent: 1,
// //         _id: 0,
// //       },
// //     }
// //   );

// //   if (!updatedPreferences) {
// //     throw new AppError(httpStatus.NOT_FOUND, 'Client preferences not found!');
// //   }

// //   return updatedPreferences;
// // };

// // getDiscoverArtistsFromDB
// // const getDiscoverArtistsFromDB = async (
// //   user: IAuth,
// //   query: Record<string, unknown>
// // ) => {
// //   // Fetch the client data
// //   const client = await Client.findOne({ auth: user._id });

// //   if (!client) {
// //     throw new AppError(httpStatus.NOT_FOUND, 'Client not found!');
// //   }

// //   // Define the earth radius in kilometers (6378.1 km) - This is useful for understanding the scale
// //   const longitude = client.location.coordinates[0]; // Client longitude
// //   const latitude = client.location.coordinates[1]; // Client latitude
// //   const radius = client.radius; // Client's search radius (in kilometers)

// //   // Check if 'query.type' is provided. If not, fetch all types.
// //   let artistTypeFilter = {};
// //   if (typeof query?.type === 'string') {
// //     // Case-insensitive match using regex if type is provided
// //     artistTypeFilter = {
// //       type: {
// //         $regex: new RegExp(query?.type, 'i'), // 'i' for case-insensitive search
// //       },
// //     };
// //   }

// //   // Pagination parameters
// //   const page = parseInt(query?.page as string, 10) || 1; // Default to page 1 if not provided
// //   const limit = parseInt(query?.limit as string, 10) || 10; // Default to 10 items per page if not provided

// //   // Calculate skip value based on page and pageSize
// //   const skip = (page - 1) * limit;

// //   // Perform the count query to get the total number of matching artists
// //   const totalArtists = await Business.aggregate([
// //     {
// //       $geoNear: {
// //         near: {
// //           type: 'Point',
// //           coordinates: [longitude, latitude], // Client's location [longitude, latitude]
// //         },
// //         distanceField: 'distance',
// //         maxDistance: radius * 1000, // Convert radius to meters (radius is in kilometers, so multiply by 1000)
// //         spherical: true, // Use spherical geometry to calculate distance accurately
// //       },
// //     },
// //     {
// //       $match: {
// //         ...artistTypeFilter,
// //       },
// //     },
// //     {
// //       $count: 'totalArtists', // Count the total number of artists
// //     },
// //   ]);

// //   // Calculate the total number of pages
// //   const total = totalArtists[0]?.totalArtists || 0;
// //   const totalPage = Math.ceil(total / limit); // Total pages

// //   // Aggregation query to find artists within the specified radius
// //   const artists = await Business.aggregate([
// //     {
// //       $geoNear: {
// //         near: {
// //           type: 'Point',
// //           coordinates: [longitude, latitude], // Client's location [longitude, latitude]
// //         },
// //         distanceField: 'distance',
// //         maxDistance: radius * 1000, // Convert radius to meters (radius is in kilometers, so multiply by 1000)
// //         spherical: true, // Use spherical geometry to calculate distance accurately
// //       },
// //     },
// //     {
// //       $match: {
// //         ...artistTypeFilter,
// //       },
// //     },
// //     {
// //       $lookup: {
// //         from: 'auths',
// //         localField: 'auth',
// //         foreignField: '_id',
// //         as: 'auth',
// //       },
// //     },
// //     {
// //       $unwind: {
// //         path: '$auth',
// //         preserveNullAndEmptyArrays: true,
// //       },
// //     },
// //     {
// //       $project: {
// //         _id: 1,
// //         type: 1,
// //         expertise: 1,
// //         // city: 1,
// //         stringLocation: 1,
// //         profileViews: 1,
// //         location: 1,
// //         distance: 1,
// //         'auth._id': 1,
// //         'auth.fullName': 1,
// //         'auth.email': 1,
// //         'auth.phoneNumber': 1,
// //         'auth.image': 1,
// //       },
// //     },
// //     {
// //       $skip: skip,
// //     },
// //     {
// //       $limit: limit,
// //     },
// //   ]);

// //   // Return data with pagination metadata
// //   return {
// //     data: artists,
// //     meta: {
// //       page,
// //       limit,
// //       total,
// //       totalPage,
// //     },
// //   };
// // };

// // getAllServicesFromDB
// // const getAllServicesFromDB = async (
// //   user: IAuth | null,
// //   query: Record<string, unknown>
// // ) => {
// //   if (user) {
// //     // Step 1: Fetch Client
// //     const client = await Client.findOne({ auth: user._id });

// //     if (!client) {
// //       throw new AppError(httpStatus.NOT_FOUND, 'Your Client ID not found!');
// //     }

// //     const [longitude, latitude] = client.location.coordinates; // Client longitude and latitude
// //     const radius = client.radius; // Client's search radius (in kilometers)

// //     // Step 2: Artist type filter
// //     // Check if 'query.type' is provided. If not, fetch all types.
// //     let artistTypeFilter = {};
// //     if (typeof query?.type === 'string') {
// //       // Case-insensitive match using regex if type is provided
// //       artistTypeFilter = {
// //         type: {
// //           $regex: new RegExp(query?.type, 'i'), // 'i' for case-insensitive search
// //         },
// //       };
// //     }

// //     // Step 3: Pagination
// //     const page = parseInt(query?.page as string) || 1;
// //     const limit = parseInt(query?.limit as string) || 10;
// //     const skip = (page - 1) * limit;

// //     // Step 4: Get artists within radius
// //     const artists = await Business.aggregate([
// //       {
// //         $geoNear: {
// //           near: { type: 'Point', coordinates: [longitude, latitude] },
// //           distanceField: 'distance',
// //           maxDistance: radius * 1000,
// //           spherical: true,
// //         },
// //       },
// //       { $match: artistTypeFilter },
// //       { $project: { _id: 1, distance: 1 } },
// //       // { $skip: skip },  // must load all artists
// //       // { $limit: limit }, // must load all artists
// //     ]);

// //     const artistDistanceMap = new Map(
// //       artists.map((artist) => [artist._id.toString(), artist.distance])
// //     );

// //     const artistsIDs = artists.map((artist) => artist._id);

// //     // Step 5: Build searchTerm filter
// //     const searchTerm = (query?.searchTerm as string) || '';
// //     let searchFilter: Record<string, unknown> = {};

// //     if (searchTerm) {
// //       const regex = new RegExp(searchTerm, 'i');
// //       const numVal = Number(searchTerm);

// //       // eslint-disable-next-line @typescript-eslint/no-explicit-any
// //       const orConditions: any[] = [
// //         { title: regex },
// //         { description: regex },
// //         { bodyLocation: regex },
// //       ];

// //       // id searchTerm is numeric then numeric match will be added
// //       if (!isNaN(numVal)) {
// //         orConditions.push(
// //           { price: numVal },
// //           { totalCompletedOrder: numVal },
// //           { totalReviewCount: numVal },
// //           { avgRating: numVal }
// //         );
// //       }

// //       searchFilter = { $or: orConditions };
// //     }

// //     // Step 6: Fetch Services with searchFilter and pagination
// //     const services = await Service.find({
// //       artist: { $in: artistsIDs },
// //       ...searchFilter,
// //     })
// //       .populate({
// //         path: 'artist',
// //         populate: {
// //           path: 'auth',
// //           model: 'Auth',
// //           select: 'email fullName image role',
// //         },
// //       })
// //       .skip(skip)
// //       .limit(limit)
// //       .lean(); // return plain JS objects for easier modification

// //     // Step 7: Inject distance into artist object
// //     const servicesWithDistance = services.map((service) => {
// //       const artistId = service.artist?._id?.toString();
// //       const distance = artistId ? artistDistanceMap.get(artistId) : null;
// //       return {
// //         ...service,
// //         artist: {
// //           ...service.artist,
// //           distance,
// //         },
// //       };
// //     });

// //     // Step 8: Total count for pagination
// //     const total = await Service.countDocuments({
// //       artist: { $in: artistsIDs },
// //       ...searchFilter,
// //     });
// //     // const total = services.length || 0;
// //     const totalPage = Math.ceil(total / limit);

// //     return {
// //       data: servicesWithDistance,
// //       meta: {
// //         page,
// //         limit,
// //         total,
// //         totalPage,
// //       },
// //     };
// //   } else {
// //     // if no user then QueryBuilder
// //     const serviceQuery = new QueryBuilder(
// //       Service.find().populate({
// //         path: 'artist',
// //         // select: 'type expertise city stringLocation hourlyRate description',
// //         select: 'type expertise stringLocation hourlyRate description',
// //         populate: {
// //           path: 'auth',
// //           select: 'fullName image',
// //         },
// //       }),
// //       query
// //     )
// //       .search([
// //         'title',
// //         'description',
// //         'price',
// //         'bodyLocation',
// //         'totalCompletedOrder',
// //         'totalReviewCount',
// //         'avgRating',
// //       ])
// //       .filter()
// //       .sort()
// //       .paginate();

// //     const data = await serviceQuery.modelQuery;
// //     const meta = await serviceQuery.countTotal();

// //     return { data, meta };
// //   }
// // };

// // updateClientRadiusIntoDB
// const updateClientRadiusIntoDB = async (user: IAuth, radius: number) => {
//   const client = await Client.findOneAndUpdate(
//     { auth: user._id },
//     { radius },
//     { new: true, runValidators: true }
//   ).select('_id radius');

//   if (!client) {
//     throw new AppError(httpStatus.NOT_FOUND, 'Client not found!');
//   }

//   return null;
// };

// export const ClientService = {
//   updateProfile,
//   updatePreferences,
//   // updateNotificationPreferences,
//   // updatePrivacySecuritySettings,
//   // getDiscoverArtistsFromDB,
//   // getAllServicesFromDB,
//   updateClientRadiusIntoDB,
// };
