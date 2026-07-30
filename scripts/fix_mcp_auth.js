const fs = require('fs');
const path = '/opt/goldbean/server.js';
let code = fs.readFileSync(path, 'utf8');

// Find the existing .well-known/x402 route and add mcp-registry-auth after it
const target = `app.get("/.well-known/x402", (req, res) => res.sendFile(__dirname + "/public/.well-known/x402"));`;

const routeToAdd = `app.get("/.well-known/mcp-registry-auth", (req, res) => res.sendFile(__dirname + "/public/.well-known/mcp-registry-auth"));`;

if (code.includes(target) && !code.includes('mcp-registry-auth')) {
  code = code.replace(target, target + '\n' + routeToAdd);
  fs.writeFileSync(path, code, 'utf8');
  console.log('Route added successfully');
} else if (code.includes('mcp-registry-auth')) {
  console.log('Route already exists');
} else {
  console.log('Target not found in server.js');
  process.exit(1);
}

// Also create the auth file
const authDir = '/opt/goldbean/public/.well-known';
fs.mkdirSync(authDir, { recursive: true });
const pubkey = 'MCowBQYDK2VwAyEAIShVJHtwT7dE7QlMkejvyqgyjICqb9G5iQuhBrmufMM=';
fs.writeFileSync(authDir + '/mcp-registry-auth', pubkey, 'utf8');
console.log('Auth file created');
