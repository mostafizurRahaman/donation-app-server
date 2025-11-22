import mongoose from 'mongoose';
import config from '../app/config';
import Donation from '../app/modules/Donation/donation.model';
import ScheduledDonation from '../app/modules/ScheduledDonation/scheduledDonation.model';
import RoundUp from '../app/modules/RoundUp/roundUp.model';
import RoundUpTransaction from '../app/modules/RoundUpTransaction/roundUpTransaction.model';
import Cause from '../app/modules/Causes/causes.model';
import Client from '../app/modules/Client/client.model';
import Organization from '../app/modules/Organization/organization.model';
import Business from '../app/modules/Business/business.model';
import Auth from '../app/modules/Auth/auth.model';

/**
 * Migration Script: Replace Profile IDs with Auth IDs
 * 
 * This script migrates the entire system to use Auth._id instead of profile IDs
 * while keeping all existing field names unchanged.
 */

interface ProfileMap {
  [profileId: string]: {
    auth: mongoose.Types.ObjectId;
    type: 'Client' | 'Organization' | 'Business';
  };
}

async function main() {
  console.log('🚀 Starting Auth-ID migration...');
  
  try {
    // Connect to database
    await mongoose.connect(config.database.uri);
    console.log('✅ Connected to database');

    // Step 1: Create mapping from profiles to Auth records
    console.log('📊 Creating profile to Auth mapping...');
    const profileMap: ProfileMap = await createProfileMap();
    console.log(`✅ Created mapping for ${Object.keys(profileMap).length} profiles`);

    // Step 2: Migrate each collection
    console.log('\n🔄 Starting migration process...');
    
    // Migrate Donations
    await migrateDonations(profileMap);
    
    // Migrate ScheduledDonations
    await migrateScheduledDonations(profileMap);
    
    // Migrate RoundUps
    await migrateRoundUps(profileMap);
    
    // Migrate RoundUpTransactions
    await migrateRoundUpTransactions(profileMap);
    
    // Migrate Causes
    await migrateCauses(profileMap);

    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

async function createProfileMap(): Promise<ProfileMap> {
  const profileMap: ProfileMap = {};
  
  // Map Clients to Auth
  const clients = await Client.find({ auth: { $exists: true } });
  for (const client of clients) {
    profileMap[client._id.toString()] = {
      auth: new mongoose.Types.ObjectId(client.auth.toString()),
      type: 'Client'
    };
  }
  
  // Map Organizations to Auth
  const organizations = await Organization.find({ auth: { $exists: true } });
  for (const organization of organizations) {
    profileMap[organization._id.toString()] = {
      auth: new mongoose.Types.ObjectId(organization.auth.toString()),
      type: 'Organization'
    };
  }
  
  // Map Businesses to Auth
  const businesses = await Business.find({ auth: { $exists: true } });
  for (const business of businesses) {
    profileMap[business._id.toString()] = {
      auth: new mongoose.Types.ObjectId(business.auth.toString()),
      type: 'Business'
    };
  }
  
  return profileMap;
}

async function migrateDonations(profileMap: ProfileMap) {
  console.log('🔄 Migrating Donations...');
  
  const donations = await Donation.find({
    $or: [
      { donor: { $exists: true } },
      { organization: { $exists: true } }
    ]
  });
  
  let migratedCount = 0;
  
  for (const donation of donations) {
    let updated = false;
    
    // Migrate donor field
    if (donation.donor && profileMap[donation.donor.toString()]) {
      donation.donor = profileMap[donation.donor.toString()].auth;
      updated = true;
    }
    
    // Migrate organization field
    if (donation.organization && profileMap[donation.organization.toString()]) {
      donation.organization = profileMap[donation.organization.toString()].auth;
      updated = true;
    }
    
    if (updated) {
      await donation.save();
      migratedCount++;
    }
  }
  
  console.log(`✅ Migrated ${migratedCount}/${donations.length} donations`);
}

async function migrateScheduledDonations(profileMap: ProfileMap) {
  console.log('🔄 Migrating ScheduledDonations...');
  
  const scheduledDonations = await ScheduledDonation.find({
    $or: [
      { user: { $exists: true } },
      { organization: { $exists: true } }
    ]
  });
  
  let migratedCount = 0;
  
  for (const scheduled of scheduledDonations) {
    let updated = false;
    
    // Migrate user field
    if (scheduled.user && profileMap[scheduled.user.toString()]) {
      scheduled.user = profileMap[scheduled.user.toString()].auth;
      updated = true;
    }
    
    // Migrate organization field
    if (scheduled.organization && profileMap[scheduled.organization.toString()]) {
      scheduled.organization = profileMap[scheduled.organization.toString()].auth;
      updated = true;
    }
    
    if (updated) {
      await scheduled.save();
      migratedCount++;
    }
  }
  
  console.log(`✅ Migrated ${migratedCount}/${scheduledDonations.length} scheduled donations`);
}

async function migrateRoundUps(profileMap: ProfileMap) {
  console.log('🔄 Migrating RoundUps...');
  
  const roundUps = await RoundUp.find({
    organization: { $exists: true }
  });
  
  let migratedCount = 0;
  
  for (const roundUp of roundUps) {
    let updated = false;
    
    // Migrate organization field (note: 'user' field already references Auth)
    if (roundUp.organization && profileMap[roundUp.organization.toString()]) {
      roundUp.organization = profileMap[roundUp.organization.toString()].auth;
      updated = true;
    }
    
    if (updated) {
      await roundUp.save();
      migratedCount++;
    }
  }
  
  console.log(`✅ Migrated ${migratedCount}/${roundUps.length} round-ups`);
}

async function migrateRoundUpTransactions(profileMap: ProfileMap) {
  console.log('🔄 Migrating RoundUpTransactions...');
  
  const transactions = await RoundUpTransaction.find({
    organization: { $exists: true }
  });
  
  let migratedCount = 0;
  
  for (const transaction of transactions) {
    let updated = false;
    
    // Migrate organization field (note: 'user' field already references Auth)
    if (transaction.organization && profileMap[transaction.organization.toString()]) {
      transaction.organization = profileMap[transaction.organization.toString()].auth;
      updated = true;
    }
    
    if (updated) {
      await transaction.save();
      migratedCount++;
    }
  }
  
  console.log(`✅ Migrated ${migratedCount}/${transactions.length} round-up transactions`);
}

async function migrateCauses(profileMap: ProfileMap) {
  console.log('🔄 Migrating Causes...');
  
  const causes = await Cause.find({
    organization: { $exists: true }
  });
  
  let migratedCount = 0;
  
  for (const cause of causes) {
    let updated = false;
    
    // Migrate organization field
    if (cause.organization && profileMap[cause.organization.toString()]) {
      cause.organization = profileMap[cause.organization.toString()].auth;
      updated = true;
    }
    
    if (updated) {
      await cause.save();
      migratedCount++;
    }
  }
  
  console.log(`✅ Migrated ${migratedCount}/${causes.length} causes`);
}

// Run the migration
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n🎉 All migrations completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration failed:', error);
      process.exit(1);
    });
}

export default main;
