// blt-agent/uninstall-service.js
const Service = require('node-windows').Service;
const path = require('path');

const svc = new Service({
  name: 'BLT Agent',
  script: path.join(__dirname, 'agent.js')
});

svc.on('uninstall', () => {
  console.log('✅ BLT Agent service uninstalled successfully!');
});

svc.on('error', (err) => {
  console.error('❌ Error:', err);
});

console.log('Uninstalling BLT Agent service...');
svc.uninstall();