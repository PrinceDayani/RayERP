const axios = require('axios');
const fs = require('fs');

async function testBackup() {
  try {
    console.log('Testing backup API...');
    
    // First, test if the server is running
    const healthResponse = await axios.get('http://localhost:5000/api/health');
    console.log('Server health:', healthResponse.data);
    
    // Test backup endpoint (you'll need to provide a valid token)
    const token = 'YOUR_AUTH_TOKEN_HERE'; // Replace with actual token
    
    const response = await axios.get('http://localhost:5000/api/backup/download', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      responseType: 'stream',
      timeout: 300000 // 5 minutes
    });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `test-backup-${timestamp}.zip`;
    
    const writer = fs.createWriteStream(filename);
    response.data.pipe(writer);
    
    writer.on('finish', () => {
      console.log(`Backup saved as ${filename}`);
      console.log('Backup test successful!');
    });
    
    writer.on('error', (error) => {
      console.error('Error writing backup file:', error);
    });
    
  } catch (error) {
    console.error('Backup test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testBackup();