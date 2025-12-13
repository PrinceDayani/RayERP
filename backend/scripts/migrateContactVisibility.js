// Migration script to add visibilityLevel to existing contacts
require('dotenv').config();
const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: String,
  visibilityLevel: String
}, { strict: false });

const Contact = mongoose.model('Contact', contactSchema);

async function migrateContacts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Find all contacts without visibilityLevel
    const contactsToUpdate = await Contact.find({
      $or: [
        { visibilityLevel: { $exists: false } },
        { visibilityLevel: null }
      ]
    });
    
    console.log(`Found ${contactsToUpdate.length} contacts to migrate`);
    
    let updated = 0;
    for (const contact of contactsToUpdate) {
      contact.visibilityLevel = 'personal'; // Default to personal
      await contact.save();
      updated++;
      
      if (updated % 10 === 0) {
        console.log(`Migrated ${updated}/${contactsToUpdate.length} contacts...`);
      }
    }
    
    console.log(`\n✅ Successfully migrated ${updated} contacts to have visibilityLevel='personal'`);
    
    // Verify
    const remaining = await Contact.countDocuments({
      $or: [
        { visibilityLevel: { $exists: false } },
        { visibilityLevel: null }
      ]
    });
    
    console.log(`Remaining contacts without visibilityLevel: ${remaining}`);
    
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

migrateContacts();
