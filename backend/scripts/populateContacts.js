const mongoose = require('mongoose');
require('dotenv').config();

const companies = ['TechCorp', 'GlobalSoft', 'InnovateLabs', 'DataSystems', 'CloudWorks', 'NetSolutions', 'SmartTech', 'DigitalHub', 'FutureSoft', 'AlphaTech'];
const positions = ['CEO', 'CTO', 'CFO', 'Manager', 'Director', 'VP Sales', 'Account Manager', 'Project Manager', 'Consultant', 'Analyst'];
const categories = ['Client', 'Vendor', 'Partner', 'Supplier', 'Consultant'];
const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'];
const states = ['NY', 'CA', 'IL', 'TX', 'AZ', 'PA', 'TX', 'CA', 'TX', 'CA'];
const tags = [['Client', 'Enterprise'], ['Vendor', 'Software'], ['Partner', 'Marketing'], ['Supplier', 'Hardware'], ['Consultant', 'IT']];

const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley', 'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle', 'Kenneth', 'Dorothy', 'Kevin', 'Carol', 'Brian', 'Amanda', 'George', 'Melissa', 'Edward', 'Deborah'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'];

const generateContacts = (count) => {
  const contacts = [];
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const company = companies[Math.floor(Math.random() * companies.length)] + ' ' + ['Inc', 'Corp', 'LLC', 'Ltd', 'Solutions'][Math.floor(Math.random() * 5)];
    const cityIndex = Math.floor(Math.random() * cities.length);
    const tagSet = tags[Math.floor(Math.random() * tags.length)];
    
    contacts.push({
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@${company.toLowerCase().replace(/\s+/g, '')}.com`,
      phone: `+1-555-${String(2000 + i).padStart(4, '0')}`,
      company: company,
      position: positions[Math.floor(Math.random() * positions.length)],
      address: `${100 + i} Business St, ${cities[cityIndex]}, ${states[cityIndex]} ${10000 + i}, USA`,
      notes: `Contact from ${company}. ${categories[Math.floor(Math.random() * categories.length)]} relationship.`,
      tags: tagSet,
      reference: Math.random() > 0.5 ? `REF-${String(i + 1).padStart(4, '0')}` : undefined,
      alternativePhone: Math.random() > 0.5 ? `+1-555-${String(3000 + i).padStart(4, '0')}` : undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  return contacts;
};

const populateContacts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // Get a user to set as createdBy
    const user = await db.collection('users').findOne({});
    if (!user) {
      console.error('❌ No users found. Please run populateERP.js first.');
      process.exit(1);
    }

    // Clear existing contacts
    console.log('\n🗑️  Clearing existing contacts...');
    await db.collection('contacts').deleteMany({});
    console.log('✅ Cleared existing contacts');

    // Generate and insert contacts
    console.log('\n📞 Creating 150 contacts...');
    const contacts = generateContacts(150);
    
    // Add createdBy to all contacts
    contacts.forEach(contact => {
      contact.createdBy = user._id;
    });

    await db.collection('contacts').insertMany(contacts);
    console.log('✅ Created 150 contacts');

    console.log('\n🎉 Contacts populated successfully!');
    console.log(`   • Total contacts: ${contacts.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

populateContacts();
