import { z } from 'zod';

// Reusable validators
export const zodEnumFromObject = <T extends Record<string, string>>(obj: T) =>
  z.enum([...Object.values(obj)] as [string, ...string[]]);

// 1. createAuthSchema
const createAuthSchema = z.object({
  body: z.object({
    email: z
      .email({ message: 'Invalid email format!' }) // Ensure it's a valid email
      .transform((email) => email.toLowerCase()) // Convert email to lowercase
      .refine((email) => email !== '', { message: 'Email is required!' }) // Check that email is not empty
      .refine((value) => typeof value === 'string', {
        message: 'Full Name must be string!', // Check that email is string
      }),

    password: z
      .string({
        error: 'Password is required',
      })
      .min(8, { message: 'Password must be at least 8 characters long' })
      .max(20, { message: 'Password cannot exceed 20 characters' })
      .regex(/[A-Z]/, {
        message: 'Password must contain at least one uppercase letter',
      })
      .regex(/[a-z]/, {
        message: 'Password must contain at least one lowercase letter',
      })
      .regex(/[0-9]/, { message: 'Password must contain at least one number' })
      .regex(/[@$!%*?&#]/, {
        message: 'Password must contain at least one special character',
      }),
  }),
});

// 2. sendSignupOtpAgainSchema
const sendSignupOtpAgainSchema = z.object({
  body: z.object({
    userEmail: z
      .string({
        error: 'Email is required',
      })
      .email({ message: 'Invalid email format' }),
  }),
});

// 3. verifySignupOtpSchema
const verifySignupOtpSchema = z.object({
  body: z.object({
    userEmail: z
      .string({
        error: 'Email is required',
      })
      .email({ message: 'Invalid email format' }),
    otp: z
      .string({
        error: 'Password is required',
      })
      .min(6, { message: 'Password must be at least 6 characters long' })
      .max(6, { message: 'Password cannot exceed 6 characters' }),
  }),
});

// 4. signinSchema
const signinSchema = z.object({
  body: z.object({
    email: z
      .string({
        error: 'Email is required',
      })
      .email({ message: 'Invalid email format' }),
    password: z
      .string({
        error: 'Password is required',
      })
      .min(8, { message: 'Password must be at least 8 characters long' })
      .max(20, { message: 'Password cannot exceed 20 characters' })
      .regex(/[A-Z]/, {
        message: 'Password must contain at least one uppercase letter',
      })
      .regex(/[a-z]/, {
        message: 'Password must contain at least one lowercase letter',
      })
      .regex(/[0-9]/, { message: 'Password must contain at least one number' })
      .regex(/[@$!%*?&#]/, {
        message: 'Password must contain at least one special character',
      }),

    // fcmToken: z.string({
    //   error: 'Fcm Token is required',
    //   invalid_type_error: 'Fcm Token must be string',
    // }),
  }),
});

// // 5. createProfileSchema
// const createProfileSchema = z.object({
//   body: z
//     .object({
//       role: z.enum(['CLIENT', 'ORGANIZATION', 'BUSINESS'], {
//         error: 'Role is required',
//         invalid_type_error: 'Role must be CLIENT, ARTIST or BUSINESS',
//       }),

//       // stringLocation: z.string({
//       //   invalid_type_error: 'Address must be a  string!',
//       //   error: 'Address is required!',
//       // }),

//       // mainLocation: z
//       //   .object({
//       //     // type: z.literal('Point').default('Point'), // Type must be 'Point'
//       //     coordinates: z
//       //       .array(z.number()) // Coordinates should be an array of numbers
//       //       .length(2) // There should be exactly two numbers (longitude, latitude)
//       //       .refine(
//       //         // eslint-disable-next-line @typescript-eslint/no-unused-vars
//       //         ([longitude, latitude]) => longitude >= -180 && longitude <= 180,
//       //         {
//       //           message: 'Longitude must be between -180 and 180',
//       //         }
//       //       )
//       //       .refine(
//       //         // eslint-disable-next-line @typescript-eslint/no-unused-vars
//       //         ([longitude, latitude]) => latitude >= -90 && latitude <= 90,
//       //         {
//       //           message: 'Latitude must be between -90 and 90',
//       //         }
//       //       ),
//       //   })
//       //   .optional(),

//       // For CLIENT
//       radius: z.number().min(0).optional(),
//       notificationPreferences: z
//         .union([z.literal('app'), z.literal('email'), z.literal('sms')])
//         .array()
//         .optional(),

//       // For ARTIST
//       artistType: zodEnumFromObject(ARTIST_TYPE).optional(),
//       expertise: z.array(zodEnumFromObject(expertiseTypes)).optional(),
//       studioName: z.string().optional(),
//       description: z.string().optional(),
//       hourlyRate: z.string().optional(),
//       // city: z.string().optional(),

//       // For BUSINESS
//       businessType: z.enum(['Studio', 'Event Organizer', 'Both']).optional(),
//       servicesOffered: z.array(zodEnumFromObject(SERVICES_OFFERED)).optional(),
//       contactNumber: z.string().optional(),
//       contactEmail: z.string().email('Invalid email address').optional(),
//       // Operating Hours (Weekly)
//       operatingHours: z
//         .record(
//           zodEnumFromObject(OPERATING_DAYS),
//           z.array(
//             z
//               .object({
//                 start: z.string().regex(/^\d{2}:\d{2}$/, {
//                   message: 'Invalid time format. Use HH:MM.',
//                 }),
//                 end: z.string().regex(/^\d{2}:\d{2}$/, {
//                   message: 'Invalid time format. Use HH:MM.',
//                 }),
//               })
//               .refine(
//                 (val) => {
//                   const [sh, sm] = val.start.split(':').map(Number);
//                   const [eh, em] = val.end.split(':').map(Number);
//                   return eh > sh || (eh === sh && em > sm);
//                 },
//                 {
//                   message: 'End time must be after start time.',
//                   path: ['end'],
//                 }
//               )
//           )
//         )
//         .optional(),
//     })
//     .strict()
//     .superRefine((data, ctx) => {
//       if (data.role === ROLE.ORGANIZATION) {
//         if (!data.artistType) {
//           ctx.addIssue({
//             path: ['artistType'],
//             code: z.ZodIssueCode.custom,
//             message: 'Artist type is required.',
//           });
//         }

//         if (!data.expertise || data.expertise.length === 0) {
//           ctx.addIssue({
//             path: ['expertise'],
//             code: z.ZodIssueCode.custom,
//             message: 'Please select at least one expertise.',
//           });
//         }

//         // if (!data.studioName) {
//         //   ctx.addIssue({
//         //     path: ['studioName'],
//         //     code: z.ZodIssueCode.custom,
//         //     message: 'Studio name is required.',
//         //   });
//         // }

//         // if (!data.city) {
//         //   ctx.addIssue({
//         //     path: ['city'],
//         //     code: z.ZodIssueCode.custom,
//         //     message: 'City is required.',
//         //   });
//         // }

//         if (!data.mainLocation) {
//           ctx.addIssue({
//             path: ['mainLocation'],
//             code: z.ZodIssueCode.custom,
//             message: 'Main Location is required.',
//           });
//         }
//       }

//       if (data.role === ROLE.BUSINESS) {
//         if (!data.studioName) {
//           ctx.addIssue({
//             path: ['studioName'],
//             code: z.ZodIssueCode.custom,
//             message: 'Business name is required.',
//           });
//         }

//         if (!data.businessType) {
//           ctx.addIssue({
//             path: ['businessType'],
//             code: z.ZodIssueCode.custom,
//             message: 'Please select business type.',
//           });
//         }

//         if (!data.servicesOffered || data.servicesOffered.length === 0) {
//           ctx.addIssue({
//             path: ['servicesOffered'],
//             code: z.ZodIssueCode.custom,
//             message: 'Select at least one service offered.',
//           });
//         }

//         if (!data.mainLocation) {
//           ctx.addIssue({
//             path: ['mainLocation'],
//             code: z.ZodIssueCode.custom,
//             message: 'Main Location is required.',
//           });
//         }

//         if (!data.contactNumber) {
//           ctx.addIssue({
//             path: ['contactNumber'],
//             code: z.ZodIssueCode.custom,
//             message: 'Phone number is required.',
//           });
//         }

//         if (!data.contactEmail) {
//           ctx.addIssue({
//             path: ['contactEmail'],
//             code: z.ZodIssueCode.custom,
//             message: 'Email address is required.',
//           });
//         }
//       }
//     }),
// });

// 6. socialSigninSchema
const socialSigninSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email('Invalid email address')
      .nonempty('Email is required'),
    fcmToken: z.string().nonempty('FCM Token is required'),
    image: z.string().url('Image URL must be a valid URL'),
    fullName: z.string(),
    phoneNumber: z.string(),
    address: z.string(),
  }),
});

// 8. changePasswordSchema
const changePasswordSchema = z.object({
  body: z.object({
    oldPassword: z
      .string({
        error: 'Old password is required',
      })
      .min(8, { message: 'Old password must be at least 8 characters long' })
      .max(20, { message: 'Old password cannot exceed 20 characters' })
      .regex(/[A-Z]/, {
        message: 'Old password must contain at least one uppercase letter',
      })
      .regex(/[a-z]/, {
        message: 'Old password must contain at least one lowercase letter',
      })
      .regex(/[0-9]/, { message: 'Password must contain at least one number' })
      .regex(/[@$!%*?&#]/, {
        message: 'Old password must contain at least one special character',
      }),

    newPassword: z
      .string({
        error: 'New password is required',
      })
      .min(8, { message: 'New password must be at least 8 characters long' })
      .max(20, { message: 'New password cannot exceed 20 characters' })
      .regex(/[A-Z]/, {
        message: 'New password must contain at least one uppercase letter',
      })
      .regex(/[a-z]/, {
        message: 'New password must contain at least one lowercase letter',
      })
      .regex(/[0-9]/, { message: 'Password must contain at least one number' })
      .regex(/[@$!%*?&#]/, {
        message: 'New password must contain at least one special character',
      }),
  }),
});

// 9. forgotPasswordSchema
const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string({
        error: 'Email is required',
      })
      .email({ message: 'Invalid email format' }),
  }),
});

// 9. sendForgotPasswordOtpAgainSchema
const sendForgotPasswordOtpAgainSchema = z.object({
  body: z.object({
    token: z.string({ error: 'Token is required' }),
  }),
});

// 10. verifyOtpForForgotPasswordSchema
const verifyOtpForForgotPasswordSchema = z.object({
  body: z.object({
    token: z.string({ error: 'Token is required' }),
    otp: z
      .string({
        error: 'OTP is required',
      })
      .regex(/^\d+$/, { message: 'OTP must be a number' })
      .length(6, { message: 'OTP must be exactly 6 digits' }),
  }),
});

// 11. resetPasswordSchema
const resetPasswordSchema = z.object({
  body: z.object({
    newPassword: z
      .string({
        error: 'New password is required',
      })
      .min(8, { message: 'New password must be at least 8 characters long' })
      .max(20, { message: 'New password cannot exceed 20 characters' })
      .regex(/[A-Z]/, {
        message: 'New password must contain at least one uppercase letter',
      })
      .regex(/[a-z]/, {
        message: 'New password must contain at least one lowercase letter',
      })
      .regex(/[0-9]/, {
        message: 'New password must contain at least one number',
      })
      .regex(/[@$!%*?&#]/, {
        message: 'New password must contain at least one special character',
      }),
  }),
});

// 14. deactivateUserAccountSchema
const deactivateUserAccountSchema = z.object({
  body: z
    .object({
      email: z.string().email('Invalid email'),
      password: z.string(),
      deactivationReason: z
        .string()
        .min(3, 'Reason must be at least 3 characters'),
    })
    .strict(),
});

// 16. getAccessTokenSchema
// const getAccessTokenSchema = z.object({
//   cookies: z.object({
//     refreshToken: z.string({
//       error: 'Refresh token is required!',
//     }),
//   }),
// });

// 17. updateAuthDataSchema
const updateAuthDataSchema = z.object({
  body: z.object({
    fullName: z
      .string()
      .refine((value) => value !== '', { message: 'Full Name is required!' })
      .refine((value) => typeof value === 'string', {
        message: 'Full Name must be string!',
      }),
  }),
});

// updateFcmTokenSchema
const updateFcmTokenSchema = z.object({
  body: z.object({
    userId: z
      .string()
      .refine((value) => value !== '', { message: 'UserId is required!' })
      .refine((value) => typeof value === 'string', {
        message: 'UserId must be string!',
      }),
  }),
});

// getUserForConversationSchema
const getUserForConversationSchema = z.object({
  query: z.object({
    term: z
      .string({
        error: 'Search Term is required!',
      })
      .trim(),
  }),
});

// // resendOtpSchema
// const resendOtpSchema = z.object({
//   body: z.object({
//     email: z
//       .string({
//         error: 'Email is required',
//       })
//       .email({ message: 'Invalid email format' }),
//   }),
// });

// // accessTokenSchema
// const accessTokenSchema = z.object({
//   cookies: z.object({
//     accessToken: z.string({
//       error: 'Refresh token is required!',
//     }),
//   }),
// });

// // otpSchema
// const otpSchema = z.object({
//   body: z.object({
//     otp: z
//       .string({
//         error: 'OTP is required',
//       })
//       .regex(/^\d+$/, { message: 'OTP must be a number' })
//       .length(6, { message: 'OTP must be exactly 6 digits' }),
//   }),
// });

// export type TProfilePayload = z.infer<typeof createProfileSchema.shape.body>;

export const AuthValidation = {
  createAuthSchema,
  sendSignupOtpAgainSchema,
  verifySignupOtpSchema,
  signinSchema,
  // createProfileSchema,
  socialSigninSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  sendForgotPasswordOtpAgainSchema,
  verifyOtpForForgotPasswordSchema,
  resetPasswordSchema,
  deactivateUserAccountSchema,
  // getAccessTokenSchema,
  updateAuthDataSchema,
  updateFcmTokenSchema,
  getUserForConversationSchema,
  // resendOtpSchema,
  // accessTokenSchema,
  // otpSchema,
};
