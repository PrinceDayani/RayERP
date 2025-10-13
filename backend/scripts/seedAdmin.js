const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  status: String
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const existingUser = await User.findOne({});
    if (existingUser) {
      console.log('Users already exist. Skipping seed.');
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('101010', salt);

    const adminUser = new User({
      name: 'Prince Dayani',
      email: 'princedayani10@gmail.com',
      password: hashedPassword,
      role: 'root',
      status: 'active'
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully');
    console.log('Email: admin@restlesserp.com');
    console.log('Password: 101010');

  } catch (error) {
    console.error('❌ Error seeding admin:', error);
  } finally {
    await mongoose.disconnect();
  }
}

seedAdmin();