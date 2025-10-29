// import httpStatus from 'http-status';
// import { AppError } from '../../utils';
// // import { PipelineStage } from 'mongoose';
// import Business from '../Business/business.model';
// import Client from '../Client/client.model';

// const verifyArtistByAdminIntoDB = async (artistId: string) => {
//   const artist = await Business.findById(artistId).populate('auth');

//   if (!artist) {
//     throw new AppError(httpStatus.NOT_FOUND, 'Artist not found!');
//   }

//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   const authDoc = artist.auth as any;
//   authDoc.isActive = true;
//   await authDoc.save();
//   return null;
// };

// // verifyBusinessByAdminIntoDB
// const verifyBusinessByAdminIntoDB = async (businessId: string) => {
//   const result = await Business.findByIdAndUpdate(
//     businessId,
//     { isActive: true },
//     { new: true }
//   );

//   if (!result) {
//     throw new AppError(httpStatus.NOT_FOUND, 'Business not found!');
//   }

//   return result;
// };

// // fetchAllArtistsFromDB
// const fetchAllArtistsFromDB = async (query: Record<string, unknown>) => {
//   const artistQuery = new QueryBuilder(
//     Business.find().populate([
//       {
//         path: 'auth',
//         select: 'fullName image email phoneNumber isProfile',
//       },
//     ]),
//     query
//   )
//     // .search(['type', 'expertise', 'city'])
//     .search(['type', 'expertise', 'stringLocation'])
//     .filter()
//     .sort()
//     .sort()
//     .paginate();

//   const data = await artistQuery.modelQuery;
//   const meta = await artistQuery.countTotal();

//   return { data, meta };
// };

// // fetchAllBusinessesFromDB
// const fetchAllBusinessesFromDB = async (query: Record<string, unknown>) => {
//   const businessQuery = new QueryBuilder(
//     Business.find().populate([
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
//     ]),
//     query
//   )
//     .search([
//       // 'city',
//       'stringLocation',
//       'servicesOffered',
//       'businessType',
//       'studioName',
//       'studioName',
//     ])
//     .filter()
//     .sort()
//     .sort()
//     .paginate();

//   const data = await businessQuery.modelQuery;
//   const meta = await businessQuery.countTotal();

//   return { data, meta };
// };

// // fetchAllClientsFromDB
// const fetchAllClientsFromDB = async (query: Record<string, unknown>) => {
//   const businessQuery = new QueryBuilder(
//     Client.find().populate([
//       {
//         path: 'auth',
//         select: 'fullName image email phoneNumber isProfile',
//       },
//     ]),
//     query
//   )
//     .search([
//       'preferredArtistType',
//       'favoritePiercing',
//       'country',
//       'favoriteTattoos',
//       'lookingFor',
//     ])
//     .filter()
//     .sort()
//     .sort()
//     .paginate();

//   const data = await businessQuery.modelQuery;
//   const meta = await businessQuery.countTotal();

//   return { data, meta };
// };

// export const AdminService = {
//   verifyArtistByAdminIntoDB,
//   verifyBusinessByAdminIntoDB,
//   fetchAllArtistsFromDB,
//   fetchAllBusinessesFromDB,
//   fetchAllClientsFromDB,
// };
