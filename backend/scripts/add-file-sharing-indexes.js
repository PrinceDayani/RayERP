// Script to add database indexes for file sharing feature
// This improves query performance when searching for shared files
// Run with: node scripts/add-file-sharing-indexes.js

const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/erp-system';

async function addIndexes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('projectfiles');

    console.log('\nAdding indexes for file sharing feature...\n');

    // Index 1: sharedWithUsers (for finding files shared with specific user)
    console.log('Creating index on sharedWithUsers...');
    await collection.createIndex({ sharedWithUsers: 1 });
    console.log('✓ Index created: sharedWithUsers');

    // Index 2: sharedWithDepartments (for finding files shared with department)
    console.log('Creating index on sharedWithDepartments...');
    await collection.createIndex({ sharedWithDepartments: 1 });
    console.log('✓ Index created: sharedWithDepartments');

    // Index 3: Compound index for project + shareType
    console.log('Creating compound index on project + shareType...');
    await collection.createIndex({ project: 1, shareType: 1 });
    console.log('✓ Index created: project + shareType');

    // Index 4: Compound index for uploadedBy + createdAt (for user's uploaded files)
    console.log('Creating compound index on uploadedBy + createdAt...');
    await collection.createIndex({ uploadedBy: 1, createdAt: -1 });
    console.log('✓ Index created: uploadedBy + createdAt');

    console.log('\n========================================');
    console.log('All indexes created successfully!');
    console.log('========================================\n');

    // List all indexes
    console.log('Current indexes on projectfiles collection:');
    const indexes = await collection.indexes();
    indexes.forEach((index, i) => {
      console.log(`${i + 1}. ${JSON.stringify(index.key)} - ${index.name}`);
    });

    console.log('\n✓ Index creation complete');
    
  } catch (error) {
    console.error('✗ Error adding indexes:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
  }
}

// Run the script
addIndexes();
