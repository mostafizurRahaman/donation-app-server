import { ValueOf } from '../Auth/auth.constant';

export const OPERATING_DAYS = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
} as const;

export type TOperatingDay = ValueOf<typeof OPERATING_DAYS>;

export const SERVICES_OFFERED = {
  TATTOO_SPACES: 'Tattoo Spaces for Guest/Resident artists',
  PIERCING_ROOMS: 'Piercing Rooms for Guest/Resident artists',
  EVENTS: 'Events',
  OTHER: 'Other',
} as const;

export type TServiceOffered = ValueOf<typeof SERVICES_OFFERED>;

export const BUSINESS_TYPE = {
  STUDIO: 'Studio',
  EVENT_ORGANIZER: 'Event Organizer',
  BOTH: 'Both',
} as const;

export type TBusinessType = (typeof BUSINESS_TYPE)[keyof typeof BUSINESS_TYPE];
