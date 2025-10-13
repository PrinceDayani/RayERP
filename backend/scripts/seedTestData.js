const mongoose = require('mongoose');
const Employee = require('../src/models/Employee').default;
const Attendance = require('../src/models/Attendance').default;
const Leave = require('../src/models/Leave').default;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/erp-system', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const seedTestData = async () => {
  try {
    console.log('Seeding test data...');

    // Check if employees already exist
    const existingEmployees = await Employee.countDocuments();
    
    if (existingEmployees === 0) {
      // Create test employee
      const testEmployee = new Employee({
        employeeId: 'EMP001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@company.com',
        phone: '+1234567890',
        department: 'Engineering',
        position: 'Software Developer',
        salary: 75000,
        hireDate: new Date('2024-01-15'),
        status: 'active',
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        emergencyContact: {
          name: 'Jane Doe',
          relationship: 'Spouse',
          phone: '+1234567891'
        },
        skills: ['JavaScript', 'React', 'Node.js', 'MongoDB']
      });

      await testEmployee.save();
      console.log('✅ Test employee created:', testEmployee.firstName, testEmployee.lastName);

      // Create today's attendance record for testing
      const today = new Date();
      today.setHours(9, 15, 0, 0); // 9:15 AM check-in

      const attendance = new Attendance({
        employee: testEmployee._id,
        date: new Date().setHours(0, 0, 0, 0),
        checkIn: today,
        status: 'present',
        totalHours: 0,
        breakTime: 0
      });

      await attendance.save();
      console.log('✅ Test attendance record created for today');

      // Create a test leave record for tomorrow (to test "On Leave" functionality)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

      const leave = new Leave({
        employee: testEmployee._id,
        leaveType: 'vacation',
        startDate: tomorrow,
        endDate: dayAfterTomorrow,
        totalDays: 2,
        reason: 'Personal vacation',
        status: 'approved',
        appliedDate: new Date(),
        approvedDate: new Date()
      });

      await leave.save();
      console.log('✅ Test leave record created for tomorrow');
    } else {
      console.log('✅ Employees already exist, skipping seed');
    }

    console.log('✅ Test data seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    process.exit(1);
  }
};

seedTestData();