const { execSync } = require('child_process');

console.log('🔄 Resetting Finance Data...\n');

try {
  console.log('Step 1: Clearing old data...');
  execSync('node scripts/clearFinanceData.js', { stdio: 'inherit' });
  
  console.log('\nStep 2: Seeding new data...');
  execSync('node scripts/seedNewFinanceData.js', { stdio: 'inherit' });
  
  console.log('\n✅ Finance data reset complete!');
} catch (error) {
  console.error('❌ Error resetting finance data:', error.message);
  process.exit(1);
}
