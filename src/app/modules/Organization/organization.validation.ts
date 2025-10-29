import { z } from 'zod';

// Business Profile Validation
const businessProfileSchema = z.object({
  body: z.object({
    studioName: z.string().min(3, 'Studio Name is required'),
    businessType: z.enum(['Studio', 'Event Organizer', 'Both']),
    country: z.string().min(2, 'Country is required'),
  }),
});

// Business Preferences Validation
const businessPreferencesSchema = z.object({
  body: z.object({
    autoApproveGuestSpots: z.boolean(),
    cancellationPolicy: z.enum(['24-hour', '48-hour', '72-hour']),
    preferredArtistType: z.enum(['Tattoo Artist', 'Piercer', 'Both']),
    preferredExperience: z.enum(['1-3 years', '3-5 years', '5+ years']),
    notificationPreferences: z.array(z.enum(['app', 'email', 'sms'])),
    twoFactorAuthEnabled: z.boolean(),
  }),
});

// Business Notification Preferences Validation
const businessNotificationSchema = z.object({
  body: z.object({
    guestSpotRequests: z.boolean(),
    guestSpotConfirmations: z.boolean(),
    guestSpotCancellations: z.boolean(),
    newEventRegistrations: z.boolean(),
    newMessageAlerts: z.boolean(),
    paymentReceivedAlerts: z.boolean(),
    newAvailability: z.boolean(),
    lastMinuteBookings: z.boolean(),
    newGuestArtists: z.boolean(),
    notificationPreferences: z.array(z.enum(['app', 'email', 'sms'])),
  }),
});

// Business Security Settings Validation
const businessSecuritySettingsSchema = z.object({
  body: z.object({
    twoFactorAuthEnabled: z.boolean(),
    hideEarnings: z.boolean(),
    manualDepositApproval: z.boolean(),
    language: z.string(),
    dateFormat: z.string(),
  }),
});

// guestSpotsSchema
const guestSpotsSchema = z.object({
  body: z.object({
    guestSpots: z
      .array(
        z.object({
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
          location: z.string(),
        })
      )
      .nonempty('At least one guest spot is required'),
  }),
});

// Zod validation for setting time off for a business
const timeOffSchema = z.object({
  body: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  }),
});

export const BusinessValidation = {
  businessProfileSchema,
  businessPreferencesSchema,
  businessNotificationSchema,
  businessSecuritySettingsSchema,
  guestSpotsSchema,
  timeOffSchema,
};

// Type definitions for payloads
export type TUpdateBusinessProfilePayload = z.infer<
  typeof businessProfileSchema.shape.body
>;

export type TUpdateBusinessPreferencesPayload = z.infer<
  typeof businessPreferencesSchema.shape.body
>;

export type TUpdateBusinessNotificationPayload = z.infer<
  typeof businessNotificationSchema.shape.body
>;

export type TUpdateBusinessSecuritySettingsPayload = z.infer<
  typeof businessSecuritySettingsSchema.shape.body
>;
