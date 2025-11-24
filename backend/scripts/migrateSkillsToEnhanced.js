/**
 * Migration script to convert legacy employee skills to enhanced skills format
 * Run this script after deploying the enhanced skill matrix feature
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rayerp';

const employeeSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  skills: [String],
  skillsEnhanced: [{
    skill: String,
    level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'] },
    yearsOfExperience: Number,
    lastUpdated: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

const Employee = mongoose.model('Employee', employeeSchema);

async function migrateSkills() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Find employees with legacy skills but no enhanced skills
    const employees = await Employee.find({
      skills: { $exists: true, $ne: [] },
      $or: [
        { skillsEnhanced: { $exists: false } },
        { skillsEnhanced: { $size: 0 } }
      ]
    });

    console.log(`Found ${employees.length} employees to migrate`);

    let migratedCount = 0;
    for (const employee of employees) {
      if (employee.skills && employee.skills.length > 0) {
        // Convert legacy skills to enhanced format with default 'Intermediate' level
        const enhancedSkills = employee.skills.map(skill => ({
          skill,
          level: 'Intermediate', // Default level for migrated skills
          yearsOfExperience: undefined,
          lastUpdated: new Date()
        }));

        employee.skillsEnhanced = enhancedSkills;
        await employee.save();
        migratedCount++;
        
        console.log(`Migrated ${employee.firstName} ${employee.lastName} - ${employee.skills.length} skills`);
      }
    }

    console.log(`Migration completed! Migrated ${migratedCount} employees`);
    
    // Show summary
    const totalEmployees = await Employee.countDocuments({ status: 'active' });
    const employeesWithEnhancedSkills = await Employee.countDocuments({ 
      skillsEnhanced: { $exists: true, $ne: [] } 
    });
    
    console.log('\n=== Migration Summary ===');
    console.log(`Total active employees: ${totalEmployees}`);
    console.log(`Employees with enhanced skills: ${employeesWithEnhancedSkills}`);
    console.log(`Migration coverage: ${((employeesWithEnhancedSkills / totalEmployees) * 100).toFixed(1)}%`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateSkills();
}

module.exports = { migrateSkills };