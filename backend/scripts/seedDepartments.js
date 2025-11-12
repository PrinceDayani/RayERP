const mongoose = require('mongoose');
require('dotenv').config();

const departmentSchema = new mongoose.Schema({
  name: String,
  description: String,
  manager: {
    name: String,
    email: String,
    phone: String
  },
  location: String,
  budget: Number,
  status: String,
  employeeCount: Number
}, { timestamps: true });

const Department = mongoose.model('Department', departmentSchema);

const departments = [
  {
    name: 'Engineering',
    description: 'Software development and IT infrastructure',
    manager: { name: 'John Doe', email: 'john@company.com', phone: '+1-555-0101' },
    location: 'Building A, Floor 3',
    budget: 500000,
    status: 'active',
    employeeCount: 0
  },
  {
    name: 'Human Resources',
    description: 'Employee management and recruitment',
    manager: { name: 'Jane Smith', email: 'jane@company.com', phone: '+1-555-0102' },
    location: 'Building B, Floor 1',
    budget: 150000,
    status: 'active',
    employeeCount: 0
  },
  {
    name: 'Sales',
    description: 'Business development and sales operations',
    manager: { name: 'Mike Johnson', email: 'mike@company.com', phone: '+1-555-0103' },
    location: 'Building A, Floor 2',
    budget: 300000,
    status: 'active',
    employeeCount: 0
  },
  {
    name: 'Marketing',
    description: 'Brand and digital marketing strategies',
    manager: { name: 'Sarah Williams', email: 'sarah@company.com', phone: '+1-555-0104' },
    location: 'Building B, Floor 2',
    budget: 250000,
    status: 'active',
    employeeCount: 0
  }
];

async function seedDepartments() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    await Department.deleteMany({});
    console.log('Cleared existing departments');

    await Department.insertMany(departments);
    console.log('Departments seeded successfully');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding departments:', error);
    process.exit(1);
  }
}

seedDepartments();
