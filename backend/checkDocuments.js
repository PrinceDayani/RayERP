require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    const FinancialDocument = mongoose.model('FinancialDocument', new mongoose.Schema({}, { strict: false }));
    
    const docs = await FinancialDocument.find();
    console.log(`\n📄 Total documents in DB: ${docs.length}\n`);
    
    docs.forEach((doc, i) => {
      console.log(`${i + 1}. ${doc.name}`);
      console.log(`   Type: ${doc.type}`);
      console.log(`   URL: ${doc.fileUrl}`);
      console.log(`   Uploaded: ${doc.uploadedAt}`);
      console.log(`   By: ${doc.uploadedBy || 'Unknown'}`);
      console.log('');
    });
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
