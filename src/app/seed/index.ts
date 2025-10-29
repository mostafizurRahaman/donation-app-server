/* eslint-disable no-console */
import config from '../config';
import { ROLE } from '../modules/Auth/auth.constant';
import Auth from '../modules/Auth/auth.model';

const adminUser = {
  role: ROLE.ADMIN,
  email: config.admin.email,
  password: config.admin.password,
  otp: '654321',
  otpExpiry: new Date(),
  isVerifiedByOTP: true,
};

const seedAdmin = async () => {
  try {
    // Check if an admin already exists
    const isAdminExist = await Auth.findOne({
      role: ROLE.ADMIN,
      email: config.admin.email,
    });

    if (!isAdminExist) {
      await Auth.create(adminUser);

      console.log('Admin created successfully!');
    } else {
      console.log('Admin already exists!');
    }
  } catch (error) {
    console.error('Error seeding admin:', error);
  }
};

export default seedAdmin;
