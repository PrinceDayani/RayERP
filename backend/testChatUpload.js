const fs = require('fs');
const path = require('path');

// Test script to verify chat upload directory and configuration

console.log('🧪 Testing Chat File Upload Configuration...\n');

// Check if uploads/chat directory exists
const uploadDir = path.join(__dirname, 'uploads', 'chat');
console.log('📁 Checking upload directory:', uploadDir);

if (fs.existsSync(uploadDir)) {
  console.log('✅ Upload directory exists');
  
  // Check permissions
  try {
    fs.accessSync(uploadDir, fs.constants.W_OK);
    console.log('✅ Directory is writable');
  } catch (err) {
    console.log('❌ Directory is not writable:', err.message);
  }
  
  // List files
  const files = fs.readdirSync(uploadDir);
  console.log(`📊 Files in directory: ${files.length}`);
  if (files.length > 0) {
    console.log('   Files:', files.slice(0, 5).join(', '));
  }
} else {
  console.log('❌ Upload directory does not exist');
  console.log('   Creating directory...');
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('✅ Directory created successfully');
  } catch (err) {
    console.log('❌ Failed to create directory:', err.message);
  }
}

console.log('\n📋 Configuration Summary:');
console.log('   - Upload path: /uploads/chat/');
console.log('   - Max file size: 10MB');
console.log('   - Allowed types: images, documents');
console.log('   - Naming format: chat-{timestamp}-{random}.{ext}');

console.log('\n✨ Test complete!');
