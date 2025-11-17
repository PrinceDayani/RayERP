const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying System Backup Setup...\n');

// Check backend files
const backendFiles = [
  'backend/src/controllers/backupController.ts',
  'backend/src/routes/backupRoutes.ts',
  'backend/test-backup.js'
];

console.log('📁 Backend Files:');
backendFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
  }
});

// Check frontend files
const frontendFiles = [
  'frontend/src/components/SystemBackup.tsx',
  'frontend/src/components/BackupStatus.tsx',
  'frontend/src/lib/api/backupAPI.ts',
  'frontend/src/app/dashboard/backup/page.tsx',
  'frontend/src/components/admin/AdminOverview.tsx'
];

console.log('\n🎨 Frontend Files:');
frontendFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
  }
});

// Check documentation
const docFiles = [
  'SYSTEM_BACKUP_GUIDE.md'
];

console.log('\n📚 Documentation:');
docFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
  }
});

// Check if routes are registered
const routesFile = path.join(__dirname, 'backend/src/routes/index.ts');
if (fs.existsSync(routesFile)) {
  const routesContent = fs.readFileSync(routesFile, 'utf8');
  if (routesContent.includes('backupRoutes')) {
    console.log('\n✅ Backup routes are registered in index.ts');
  } else {
    console.log('\n❌ Backup routes NOT registered in index.ts');
  }
} else {
  console.log('\n❌ Routes index file not found');
}

console.log('\n🚀 Setup Verification Complete!');
console.log('\n📋 Next Steps:');
console.log('1. Start the backend server: cd backend && npm run dev');
console.log('2. Start the frontend server: cd frontend && npm run dev');
console.log('3. Login as admin user');
console.log('4. Navigate to Admin Dashboard > System Backup');
console.log('5. Test the backup functionality');
console.log('\n💡 Troubleshooting:');
console.log('- Ensure user has ADMIN, SUPER_ADMIN, or ROOT role');
console.log('- Check browser console for any errors');
console.log('- Verify API connection and authentication');
console.log('- Check server logs for backend errors');