import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('MONGO_URI is not defined in environment variables');
  process.exit(1);
}

async function migrateDeviceFingerprints() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const UserSession = mongoose.connection.collection('user_sessions');

    // Option 1: Clear all existing sessions (recommended for security)
    console.log('\n⚠️  Clearing all existing sessions for device fingerprint migration...');
    const result = await UserSession.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} existing sessions`);
    console.log('⚠️  All users will need to login again with device fingerprinting enabled');

    // Option 2: Add default fingerprint to existing sessions (less secure, not recommended)
    // Uncomment below if you want to keep existing sessions
    /*
    console.log('\n⚠️  Adding default device fingerprints to existing sessions...');
    const sessions = await UserSession.find({ deviceFingerprint: { $exists: false } }).toArray();
    
    for (const session of sessions) {
      const defaultFingerprint = {
        hash: 'legacy-session',
        components: {
          userAgent: session.deviceInfo?.userAgent || 'Unknown',
          acceptLanguage: 'Unknown',
          acceptEncoding: 'Unknown',
          ipAddress: session.ipAddress || 'Unknown'
        },
        confidence: 'low'
      };
      
      await UserSession.updateOne(
        { _id: session._id },
        { $set: { deviceFingerprint: defaultFingerprint } }
      );
    }
    
    console.log(`✅ Updated ${sessions.length} sessions with default fingerprints`);
    console.log('⚠️  Legacy sessions have low confidence fingerprints');
    */

    console.log('\n✅ Migration completed successfully!');
    console.log('\nNew Device Fingerprinting Features:');
    console.log('- Device fingerprinting for session security');
    console.log('- Token binding to specific devices');
    console.log('- Enhanced CSRF protection with device validation');
    console.log('- Activity logs include device fingerprints');
    console.log('- Suspicious device change detection');
    console.log('- Automatic session revocation on high-risk changes');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

migrateDeviceFingerprints();
