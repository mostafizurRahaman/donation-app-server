import bcrypt from 'bcryptjs';
import { model, Schema } from 'mongoose';
import config from '../../config';
import { ROLE } from './auth.constant';
import { IAuth, IAuthModel } from './auth.interface';

const authSchema = new Schema<IAuth, IAuthModel>(
  {
    email: {
      type: String,
      required: [true, 'Email is required!'],
      unique: [true, 'This email is already used!'],
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: 0,
    },
    passwordChangedAt: {
      type: Date,
    },

    otp: {
      type: String,
      required: true,
    },
    otpExpiry: {
      type: Date,
      required: true,
    },
    isVerifiedByOTP: {
      type: Boolean,
      default: false,
    },

    role: {
      type: String,
      enum: Object.values(ROLE),
      default: ROLE.CLIENT,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, versionKey: false }
);

// Custom hooks/methods
authSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(
    this.password,
    Number(config.bcrypt_salt_rounds)
  );
  next();
});

authSchema.pre('find', function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

authSchema.pre('findOne', function (next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

authSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
  next();
});

authSchema.post('save', function (doc, next) {
  doc.password = '';
  next();
});

// isUserExistsByEmail
authSchema.statics.isUserExistsByEmail = async function (
  email: string
): Promise<IAuth | null> {
  return await Auth.findOne({ email }).select('+password');
};

// isPasswordMatched
authSchema.methods.isPasswordMatched = async function (
  plainTextPassword: string
): Promise<boolean> {
  return await bcrypt.compare(plainTextPassword, this.password);
};

// isJWTIssuedBeforePasswordChanged
authSchema.methods.isJWTIssuedBeforePasswordChanged = function (
  jwtIssuedTimestamp: number
): boolean {
  const passwordChangedTime = new Date(this.passwordChangedAt).getTime() / 1000;
  return passwordChangedTime > jwtIssuedTimestamp;
};

const Auth = model<IAuth, IAuthModel>('Auth', authSchema);

export default Auth;
