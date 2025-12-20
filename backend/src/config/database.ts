import mongoose from 'mongoose';
import { logger } from '../utils/logger';

// Optimized MongoDB connection configuration
export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI!, {
      // Connection pool optimization
      maxPoolSize: 20, // Increased from 10
      minPoolSize: 5,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      
      // Performance optimizations
      bufferCommands: false,
      
      // Read/Write concerns for performance
      readPreference: 'primary',
      writeConcern: { w: 'majority', j: true },
      
      // Compression
      compressors: ['zlib'],
      zlibCompressionLevel: 6,
    });

    // Enable query optimization
    mongoose.set('debug', process.env.NODE_ENV === 'development');
    
    // Connection event handlers
    mongoose.connection.on('connected', () => {
      logger.info('✅ MongoDB connected successfully');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ MongoDB disconnected');
    });

    return conn;
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

// Database indexes for common queries
export const createIndexes = async () => {
  try {
    const db = mongoose.connection.db;
    
    // User collection indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ role: 1 });
    await db.collection('users').createIndex({ department: 1 });
    
    // Project collection indexes
    await db.collection('projects').createIndex({ status: 1 });
    await db.collection('projects').createIndex({ assignedUsers: 1 });
    await db.collection('projects').createIndex({ createdAt: -1 });
    
    // Task collection indexes
    await db.collection('tasks').createIndex({ projectId: 1, status: 1 });
    await db.collection('tasks').createIndex({ assignedTo: 1 });
    
    // Finance collection indexes
    await db.collection('journalentries').createIndex({ date: -1 });
    await db.collection('journalentries').createIndex({ accountId: 1 });
    await db.collection('accounts').createIndex({ code: 1 }, { unique: true });
    
    logger.info('✅ Database indexes created successfully');
  } catch (error) {
    logger.error('❌ Error creating indexes:', error);
  }
};