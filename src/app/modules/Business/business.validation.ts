// // import parsePhoneNumberFromString from 'libphonenumber-js';
// import { z } from 'zod';

// // Define the validation schemas under the "body" object for each section
// const artistProfileSchema = z.object({
//   body: z.object({
//     fullName: z.string().min(3, 'Full name is required'),
//   }),
// });

// const artistPreferencesSchema = z.object({
//   body: z.object({
//     showAvailability: z.boolean().optional(),
//     publiclyVisibleProfile: z.boolean().optional(),
//     cancellationPolicy: z.enum(['24-hour', '48-hour', '72-hour']),
//     allowDirectMessages: z.boolean(),
//     notificationPreferences: z.array(z.enum(['app', 'email', 'sms'])),
//     twoFactorAuthEnabled: z.boolean(),
//   }),
// });

// const artistNotificationSchema = z.object({
//   body: z.object({
//     bookingRequests: z.boolean(),
//     bookingConfirmations: z.boolean(),
//     bookingCancellations: z.boolean(),
//     eventReminders: z.boolean(),
//     newMessages: z.boolean(),
//     appUpdates: z.boolean(),
//     newAvailability: z.boolean(),
//     lastMinuteBookings: z.boolean(),
//     newGuestArtists: z.boolean(),
//     notificationPreferences: z.array(z.enum(['app', 'email', 'sms'])),
//   }),
// });

// const artistPrivacySecuritySchema = z.object({
//   body: z.object({
//     twoFactorAuthEnabled: z.boolean(),
//     language: z.string(),
//     dateFormat: z.string(),
//   }),
// });

// // const updateSchema = z.object({
// //   body: z
// //     .object({
// //       // Profile Info
// //       fullName: z.string().optional(),
// //       email: z.string().email('Invalid email format').optional(),
// //       phoneNumber: z
// //         .string()
// //         .refine(
// //           (val) => {
// //             const parsed = parsePhoneNumberFromString(val);
// //             return parsed?.isValid();
// //           },
// //           {
// //             message: 'Phone number must be a valid international format',
// //           }
// //         )
// //         .optional(),
// //       country: z.string().optional(),
// //       contact: z
// //         .object({
// //           email: z.string().email('Invalid email format').optional(),
// //           phone: z
// //             .string()
// //             .refine(
// //               (val) => {
// //                 const parsed = parsePhoneNumberFromString(val);
// //                 return parsed?.isValid();
// //               },
// //               {
// //                 message: 'Phone number must be a valid international format',
// //               }
// //             )
// //             .optional(),
// //           address: z
// //             .string()
// //             .min(5, 'Address should be at least 5 characters long')
// //             .optional(),
// //         })
// //         .optional(),
// //       description: z.string().optional(),

// //       // Preferences
// //       showAvailability: z.boolean().optional().optional(),
// //       publiclyVisibleProfile: z.boolean().optional().optional(),
// //       cancellationPolicy: z
// //         .enum(Object.values(cancellationPolicy) as [string, ...string[]])
// //         .optional(),
// //       allowDirectMessages: z.boolean().optional(),
// //       notificationPreferences: z
// //         .array(
// //           z.enum(Object.values(notificationChannel) as [string, ...string[]])
// //         )
// //         .optional(),
// //       twoFactorAuthEnabled: z.boolean().optional(),

// //       // Notifications
// //       bookingRequests: z.boolean().optional(),
// //       bookingConfirmations: z.boolean().optional(),
// //       bookingCancellations: z.boolean().optional(),
// //       eventReminders: z.boolean().optional(),
// //       newMessages: z.boolean().optional(),
// //       appUpdates: z.boolean().optional(),
// //       newAvailability: z.boolean().optional(),
// //       lastMinuteBookings: z.boolean().optional(),
// //       newGuestArtists: z.boolean().optional(),

// //       // Privacy & Security
// //       language: z.string().optional(),
// //       dateFormat: z
// //         .enum(Object.values(dateFormats) as [string, ...string[]])
// //         .optional(),

// //       // Artist-specific fields
// //       services: z
// //         .object({
// //           hourlyRate: z
// //             .number()
// //             .min(0, { message: 'Hourly rate must be a non-negative number.' })
// //             .optional(),
// //           dayRate: z
// //             .number()
// //             .min(0, { message: 'Day rate must be a non-negative number.' })
// //             .optional(),
// //           consultationsFee: z
// //             .number()
// //             .min(0, {
// //               message: 'Consultation fee must be a non-negative number.',
// //             })
// //             .optional(),
// //         })
// //         .optional(),

// //       artistType: z
// //         .enum(Object.values(ARTIST_TYPE) as [string, ...string[]])
// //         .optional(),
// //       expertise: z
// //         .array(z.enum(Object.values(expertiseTypes) as [string, ...string[]]))
// //         .optional(),
// //       studioName: z.string().optional(),
// //       // city: z.string().optional(),
// //       location: z
// //         .object({
// //           longitude: z.number().min(-180).max(180),
// //           latitude: z.number().min(-90).max(90),
// //         })
// //         .optional(),
// //     })
// //     .strict(),
// // });

// const availabilitySchema = z.object({
//   body: z.object({
//     slots: z
//       .array(
//         z.object({
//           start: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
//           end: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
//         })
//       )
//       .nonempty('At least one time slot is required'),
//   }),
// });

// const timeOffSchema = z.object({
//   body: z.object({
//     dates: z.array(
//       z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
//     ),
//   }),
// });

// const setOffDaysSchema = z.object({
//   body: z.object({
//     startDate: z.coerce.date(),
//     endDate: z.coerce.date(),
//   }),
// });

// export type TSetOffDays = z.infer<typeof setOffDaysSchema.shape.body>;

// export const ArtistValidation = {
//   artistProfileSchema,
//   artistPreferencesSchema,
//   artistNotificationSchema,
//   artistPrivacySecuritySchema,
//   // updateSchema,
//   availabilitySchema,
//   timeOffSchema,
//   setOffDaysSchema,
// };

// // Type definitions based on the updated schemas
// export type TUpdateArtistProfilePayload = z.infer<typeof artistProfileSchema.shape.body>;

// export type TUpdateArtistPreferencesPayload = z.infer<typeof artistPreferencesSchema.shape.body>;

// export type TUpdateArtistNotificationPayload = z.infer<typeof artistNotificationSchema.shape.body>;

// export type TUpdateArtistPrivacySecurityPayload = z.infer<typeof artistPrivacySecuritySchema.shape.body>;

// // export type TUpdateArtistPayload = z.infer<typeof updateSchema.shape.body>;
