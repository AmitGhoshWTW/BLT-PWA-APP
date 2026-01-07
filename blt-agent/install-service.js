// blt-agent/install-service.js
const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
  name: 'BLT Agent',
  description: 'Background service for Bug Logging Tool to collect log files',
  script: path.join(__dirname, 'agent.js'),
  nodeOptions: [
    '--harmony',
    '--max_old_space_size=4096'
  ],
  env: [
    {
      name: "NODE_ENV",
      value: "production"
    }
  ]
});

// Listen for the "install" event
svc.on('install', () => {
  console.log('✅ BLT Agent service installed successfully!');
  console.log('Starting service...');
  svc.start();
});

svc.on('start', () => {
  console.log('✅ BLT Agent service started!');
  console.log('Agent is running on http://localhost:42080');
  console.log('');
  console.log('You can now use the web app to collect log files automatically.');
  console.log('');
  console.log('To uninstall: node uninstall-service.js');
});

svc.on('alreadyinstalled', () => {
  console.log('⚠️  Service is already installed.');
  console.log('To reinstall:');
  console.log('  1. Run: node uninstall-service.js');
  console.log('  2. Run: node install-service.js');
});

svc.on('error', (err) => {
  console.error('❌ Error:', err);
});

// Install the service
console.log('Installing BLT Agent service...');
svc.install();