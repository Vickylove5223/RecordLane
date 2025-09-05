// Simple test to verify Encore secrets are accessible
const { exec } = require('child_process');

console.log('Testing Encore secrets configuration...\n');

// Test if we can access the secrets
exec('encore secret list', (error, stdout, stderr) => {
  if (error) {
    console.error('Error running encore secret list:', error);
    return;
  }
  
  console.log('Available secrets:');
  console.log(stdout);
  
  // Check if our required secrets are present
  if (stdout.includes('GoogleClientID') && stdout.includes('GoogleClientSecret')) {
    console.log('✅ Google OAuth secrets are configured!');
  } else {
    console.log('❌ Google OAuth secrets are missing!');
  }
});

// Test backend configuration endpoint
setTimeout(() => {
  console.log('\nTesting backend configuration endpoint...');
  
  const http = require('http');
  
  const options = {
    hostname: 'localhost',
    port: 4000,
    path: '/auth/config',
    method: 'GET'
  };
  
  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const config = JSON.parse(data);
        console.log('✅ Backend configuration loaded successfully!');
        console.log('Client ID:', config.clientID ? 'Present' : 'Missing');
      } catch (e) {
        console.log('❌ Failed to parse backend response:', data);
      }
    });
  });
  
  req.on('error', (err) => {
    console.log('❌ Backend not running or not accessible:', err.message);
    console.log('Please start the backend with: encore run');
  });
  
  req.end();
}, 2000);
