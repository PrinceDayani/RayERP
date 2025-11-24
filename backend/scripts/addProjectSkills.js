const mongoose = require('mongoose');
require('dotenv').config();

const addProjectSkills = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // Update projects with required skills
    console.log('\n🎯 Adding required skills to projects...');
    
    // ERP System Enhancement project
    await db.collection('projects').updateOne(
      { name: 'ERP System Enhancement' },
      {
        $set: {
          requiredSkills: [
            { skill: 'JavaScript', level: 'Advanced', priority: 'required' },
            { skill: 'React', level: 'Advanced', priority: 'required' },
            { skill: 'Node.js', level: 'Advanced', priority: 'required' },
            { skill: 'MongoDB', level: 'Intermediate', priority: 'required' },
            { skill: 'System Architecture', level: 'Advanced', priority: 'required' },
            { skill: 'Project Management', level: 'Intermediate', priority: 'preferred' },
            { skill: 'Docker', level: 'Intermediate', priority: 'preferred' },
            { skill: 'AWS', level: 'Intermediate', priority: 'nice-to-have' }
          ]
        }
      }
    );

    // Employee Onboarding Portal project
    await db.collection('projects').updateOne(
      { name: 'Employee Onboarding Portal' },
      {
        $set: {
          requiredSkills: [
            { skill: 'JavaScript', level: 'Intermediate', priority: 'required' },
            { skill: 'React', level: 'Intermediate', priority: 'required' },
            { skill: 'HR Management', level: 'Advanced', priority: 'required' },
            { skill: 'Content Creation', level: 'Intermediate', priority: 'preferred' },
            { skill: 'Project Management', level: 'Intermediate', priority: 'preferred' }
          ]
        }
      }
    );

    // Marketing Campaign Analytics project
    await db.collection('projects').updateOne(
      { name: 'Marketing Campaign Analytics' },
      {
        $set: {
          requiredSkills: [
            { skill: 'Digital Marketing', level: 'Advanced', priority: 'required' },
            { skill: 'Analytics', level: 'Advanced', priority: 'required' },
            { skill: 'Data Analysis', level: 'Intermediate', priority: 'required' },
            { skill: 'Content Strategy', level: 'Intermediate', priority: 'preferred' },
            { skill: 'Social Media Marketing', level: 'Intermediate', priority: 'preferred' }
          ]
        }
      }
    );

    console.log('✅ Added required skills to all projects');

    // Also update employees with enhanced skills for better matching
    console.log('\n👥 Updating employee skills...');
    
    // Update Alice Cooper with enhanced skills
    await db.collection('employees').updateOne(
      { email: 'alice.cooper@rayerp.com' },
      {
        $set: {
          skillsEnhanced: [
            { skill: 'JavaScript', level: 'Expert', yearsOfExperience: 5, lastUpdated: new Date() },
            { skill: 'React', level: 'Advanced', yearsOfExperience: 4, lastUpdated: new Date() },
            { skill: 'Node.js', level: 'Advanced', yearsOfExperience: 4, lastUpdated: new Date() },
            { skill: 'MongoDB', level: 'Advanced', yearsOfExperience: 3, lastUpdated: new Date() }
          ]
        }
      }
    );

    // Update Bob Martinez with enhanced skills
    await db.collection('employees').updateOne(
      { email: 'bob.martinez@rayerp.com' },
      {
        $set: {
          skillsEnhanced: [
            { skill: 'Docker', level: 'Expert', yearsOfExperience: 4, lastUpdated: new Date() },
            { skill: 'Kubernetes', level: 'Advanced', yearsOfExperience: 3, lastUpdated: new Date() },
            { skill: 'AWS', level: 'Advanced', yearsOfExperience: 4, lastUpdated: new Date() },
            { skill: 'CI/CD', level: 'Advanced', yearsOfExperience: 3, lastUpdated: new Date() },
            { skill: 'JavaScript', level: 'Intermediate', yearsOfExperience: 2, lastUpdated: new Date() }
          ]
        }
      }
    );

    // Update John Smith with enhanced skills
    await db.collection('employees').updateOne(
      { email: 'john.smith@rayerp.com' },
      {
        $set: {
          skillsEnhanced: [
            { skill: 'Leadership', level: 'Expert', yearsOfExperience: 8, lastUpdated: new Date() },
            { skill: 'Project Management', level: 'Expert', yearsOfExperience: 10, lastUpdated: new Date() },
            { skill: 'System Architecture', level: 'Expert', yearsOfExperience: 12, lastUpdated: new Date() },
            { skill: 'JavaScript', level: 'Advanced', yearsOfExperience: 8, lastUpdated: new Date() }
          ]
        }
      }
    );

    // Update Sarah Johnson with enhanced skills
    await db.collection('employees').updateOne(
      { email: 'sarah.johnson@rayerp.com' },
      {
        $set: {
          skillsEnhanced: [
            { skill: 'HR Management', level: 'Expert', yearsOfExperience: 7, lastUpdated: new Date() },
            { skill: 'Recruitment', level: 'Advanced', yearsOfExperience: 6, lastUpdated: new Date() },
            { skill: 'Employee Relations', level: 'Advanced', yearsOfExperience: 5, lastUpdated: new Date() },
            { skill: 'Project Management', level: 'Intermediate', yearsOfExperience: 3, lastUpdated: new Date() }
          ]
        }
      }
    );

    // Update Emily Davis with enhanced skills
    await db.collection('employees').updateOne(
      { email: 'emily.davis@rayerp.com' },
      {
        $set: {
          skillsEnhanced: [
            { skill: 'Digital Marketing', level: 'Expert', yearsOfExperience: 6, lastUpdated: new Date() },
            { skill: 'Brand Management', level: 'Advanced', yearsOfExperience: 5, lastUpdated: new Date() },
            { skill: 'Content Strategy', level: 'Advanced', yearsOfExperience: 4, lastUpdated: new Date() },
            { skill: 'Analytics', level: 'Intermediate', yearsOfExperience: 3, lastUpdated: new Date() }
          ]
        }
      }
    );

    // Update Carol White with enhanced skills
    await db.collection('employees').updateOne(
      { email: 'carol.white@rayerp.com' },
      {
        $set: {
          skillsEnhanced: [
            { skill: 'Social Media Marketing', level: 'Advanced', yearsOfExperience: 3, lastUpdated: new Date() },
            { skill: 'Content Creation', level: 'Advanced', yearsOfExperience: 4, lastUpdated: new Date() },
            { skill: 'Analytics', level: 'Advanced', yearsOfExperience: 3, lastUpdated: new Date() },
            { skill: 'Digital Marketing', level: 'Intermediate', yearsOfExperience: 2, lastUpdated: new Date() }
          ]
        }
      }
    );

    // Update Daniel Lee with enhanced skills
    await db.collection('employees').updateOne(
      { email: 'daniel.lee@rayerp.com' },
      {
        $set: {
          skillsEnhanced: [
            { skill: 'Financial Modeling', level: 'Advanced', yearsOfExperience: 4, lastUpdated: new Date() },
            { skill: 'Excel', level: 'Expert', yearsOfExperience: 5, lastUpdated: new Date() },
            { skill: 'Data Analysis', level: 'Advanced', yearsOfExperience: 3, lastUpdated: new Date() },
            { skill: 'Analytics', level: 'Intermediate', yearsOfExperience: 2, lastUpdated: new Date() }
          ]
        }
      }
    );

    console.log('✅ Updated employee enhanced skills');

    console.log('\n🎉 Project skills setup completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   • Added required skills to 3 projects');
    console.log('   • Updated enhanced skills for 6 employees');
    console.log('   • Project skill matching is now ready to use');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

addProjectSkills();