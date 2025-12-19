require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    const FinancialDocument = mongoose.model('FinancialDocument', new mongoose.Schema({}, { strict: false }));
    
    const result = await FinancialDocument.updateMany(
      { fileUrl: { $regex: '^/public/uploads' } },
      [{ $set: { fileUrl: { $replaceOne: { input: '$fileUrl', find: '/public/uploads', replacement: '/uploads' } } } }]
    );
    
    console.log(`✅ Updated ${result.modifiedCount} documents`);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
