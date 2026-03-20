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

async function migrateRefreshTokens() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const UserSession = mongoose.connection.collection('user_sessions');

    // Delete all existing sessions (users will need to login again)
    const result = await UserSession.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} existing sessions`);
    console.log('⚠️  All users will need to login again with the new authentication system');

    console.log('\n✅ Migration completed successfully!');
    console.log('\nNew Authentication System Features:');
    console.log('- Access tokens: 15 minutes (short-lived)');
    console.log('- Refresh tokens: 7 days (long-lived)');
    console.log('- HTTP-only cookies for secure storage');
    console.log('- Automatic token refresh on expiry');
    console.log('- 2-device limit per user');
    console.log('- Admin session management');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

migrateRefreshTokens();
