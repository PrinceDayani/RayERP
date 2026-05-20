/**
 * Fix Root user role - converts legacy string 'root' to proper Role ObjectId reference.
 * Run: node scripts/fixRootUserRole.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

async function fixRootUserRole() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // Find the Root role
    const rootRole = await db.collection('roles').findOne({ name: 'Root' });
    
    if (!rootRole) {
      console.log('❌ Root role not found in roles collection. Creating it...');
      const result = await db.collection('roles').insertOne({
        name: 'Root',
        description: 'System administrator with full access',
        permissions: ['*'],
        level: 100,
        isDefault: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ Root role created with ID:', result.insertedId);
      
      // Update all users with string role 'root' to use the new ObjectId
      const updateResult = await db.collection('users').updateMany(
        { role: 'root' },
        { $set: { role: result.insertedId } }
      );
      console.log(`✅ Updated ${updateResult.modifiedCount} user(s) with string role 'root'`);
    } else {
      console.log('✅ Root role found:', rootRole._id.toString());
      
      // Find users with string-based role 'root'
      const usersWithStringRole = await db.collection('users').find({ role: 'root' }).toArray();
      console.log(`   Found ${usersWithStringRole.length} user(s) with legacy string role 'root'`);

      if (usersWithStringRole.length > 0) {
        const updateResult = await db.collection('users').updateMany(
          { role: 'root' },
          { $set: { role: rootRole._id } }
        );
        console.log(`✅ Fixed ${updateResult.modifiedCount} user(s) — role updated to ObjectId`);
        
        for (const user of usersWithStringRole) {
          console.log(`   - ${user.name} (${user.email})`);
        }
      } else {
        console.log('   No users with legacy string role found.');
        
        // Also check for other string-based roles
        const usersWithAnyStringRole = await db.collection('users').find({
          role: { $type: 'string' }
        }).toArray();
        
        if (usersWithAnyStringRole.length > 0) {
          console.log(`\n⚠️  Found ${usersWithAnyStringRole.length} user(s) with OTHER string-based roles:`);
          for (const user of usersWithAnyStringRole) {
            console.log(`   - ${user.name} (${user.email}) — role: "${user.role}"`);
            
            // Try to find matching role by name (case-insensitive)
            const matchingRole = await db.collection('roles').findOne({
              name: { $regex: new RegExp(`^${user.role}$`, 'i') }
            });
            
            if (matchingRole) {
              await db.collection('users').updateOne(
                { _id: user._id },
                { $set: { role: matchingRole._id } }
              );
              console.log(`     ✅ Fixed → mapped to role "${matchingRole.name}" (${matchingRole._id})`);
            } else {
              console.log(`     ❌ No matching role found for "${user.role}"`);
            }
          }
        }
      }
    }

    // Verify
    console.log('\n--- Verification ---');
    const allUsers = await db.collection('users').find({}).project({ name: 1, email: 1, role: 1 }).toArray();
    for (const user of allUsers) {
      const roleType = typeof user.role === 'string' ? '⚠️ STRING' : '✅ ObjectId';
      console.log(`   ${roleType} | ${user.name} (${user.email}) | role: ${user.role}`);
    }

    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixRootUserRole();
