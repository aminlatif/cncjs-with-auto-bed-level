const launchServer = require('./server-cli');

launchServer().catch(err => {
  console.error('Error:', err);
});
