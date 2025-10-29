import { Document, Model, ObjectId } from 'mongoose';
import { TRole } from './auth.constant';

// Instance methods
export interface IAuth extends Document {
  _id: ObjectId;

  email: string;
  password: string;
  passwordChangedAt?: Date;

  otp: string;
  otpExpiry: Date;
  isVerifiedByOTP: boolean;

  isProfile: boolean;

  role: TRole;
  isActive: boolean;
  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  isPasswordMatched(plainTextPassword: string): Promise<boolean>;
  isJWTIssuedBeforePasswordChanged(
    jwtIssuedTimestamp: number | undefined
  ): boolean;
}

// Static methods
export interface IAuthModel extends Model<IAuth> {
  isUserExistsByEmail(email: string): Promise<IAuth | null>;
}
