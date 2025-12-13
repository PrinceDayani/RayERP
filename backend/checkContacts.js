// Quick script to check contacts in database
require('dotenv').config();
const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({}, { strict: false });
const Contact = mongoose.model('Contact', contactSchema);

async function checkContacts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const count = await Contact.countDocuments();
    console.log(`Total contacts in database: ${count}`);
    
    const contacts = await Contact.find().limit(5);
    console.log('\nFirst 5 contacts:');
    contacts.forEach(c => {
      console.log(`- ${c.name} (visibility: ${c.visibilityLevel || 'NOT SET'})`);
    });
    
    const byVisibility = await Contact.aggregate([
      { $group: { _id: '$visibilityLevel', count: { $sum: 1 } } }
    ]);
    console.log('\nContacts by visibility level:');
    byVisibility.forEach(v => {
      console.log(`- ${v._id || 'NOT SET'}: ${v.count}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkContacts();
