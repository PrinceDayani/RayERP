// Quick script to create a test project
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rayerp';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    const Project = mongoose.model('Project', new mongoose.Schema({
      name: String,
      description: String,
      status: String,
      priority: String,
      startDate: Date,
      endDate: Date,
      budget: Number,
      spentBudget: Number,
      progress: Number,
      manager: mongoose.Schema.Types.ObjectId,
      team: [mongoose.Schema.Types.ObjectId],
      owner: mongoose.Schema.Types.ObjectId,
      members: [mongoose.Schema.Types.ObjectId],
      departments: [mongoose.Schema.Types.ObjectId]
    }, { timestamps: true }));

    // Check existing projects
    const existingProjects = await Project.find({});
    console.log(`📊 Found ${existingProjects.length} existing projects`);
    
    if (existingProjects.length > 0) {
      console.log('Projects:');
      existingProjects.forEach(p => {
        console.log(`  - ${p.name} (${p._id})`);
      });
    } else {
      console.log('⚠️ No projects found in database');
    }
    
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
