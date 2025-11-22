import Auth from '../modules/Auth/auth.model';
import Client from '../modules/Client/client.model';
import Organization from '../modules/Organization/organization.model';
import Business from '../modules/Business/business.model';
import { AppError } from './AppError';
import httpStatus from 'http-status';

/**
 * getUserProfile - Helper function to resolve profile data from Auth ID
 * 
 * This function takes an Auth._id and returns the corresponding profile 
 * (Client, Organization, or Business) based on the role in the Auth record.
 * 
 * @param authId - The Auth document ID
 * @returns Promise<Client | Organization | Business>
 * @throws AppError if profile not found
 */
export async function getUserProfile(authId: string) {
  // First get the Auth record to determine the role
  const authUser = await Auth.findById(authId);
  
  if (!authUser) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Resolve profile based on role
  switch (authUser.role) {
    case 'CLIENT':
      const client = await Client.findOne({ auth: authId });
      if (!client) {
        throw new AppError(httpStatus.NOT_FOUND, 'Client profile not found');
      }
      return client;

    case 'ORGANIZATION':
      const organization = await Organization.findOne({ auth: authId });
      if (!organization) {
        throw new AppError(httpStatus.NOT_FOUND, 'Organization profile not found');
      }
      return organization;

    case 'BUSINESS':
      const business = await Business.findOne({ auth: authId });
      if (!business) {
        throw new AppError(httpStatus.NOT_FOUND, 'Business profile not found');
      }
      return business;

    default:
      throw new AppError(httpStatus.BAD_REQUEST, 'Invalid user role');
  }
}

/**
 * getUserProfiles - Helper function to resolve multiple profiles from Auth IDs
 * 
 * @param authIds - Array of Auth document IDs
 * @returns Promise<Array<Client | Organization | Business>>
 */
export async function getUserProfiles(authIds: string[]) {
  const profiles = [];
  
  for (const authId of authIds) {
    try {
      const profile = await getUserProfile(authId);
      profiles.push(profile);
    } catch (error) {
      // Skip profiles that don't exist
      console.warn(`Profile not found for Auth ID: ${authId}`);
    }
  }
  
  return profiles;
}

/**
 * getAuthFromProfile - Helper function to get Auth ID from a profile
 * 
 * @param profile - Client, Organization, or Business document
 * @returns string - Auth document ID
 */
export function getAuthFromProfile(profile: any): string {
  if (profile.auth) {
    return profile.auth.toString();
  }
  throw new Error('Profile does not have auth field');
}
