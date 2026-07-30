const fs = require('fs');
const path = '/opt/goldbean/server.js';
let code = fs.readFileSync(path, 'utf8');

// Check if the bad route exists and replace it
const oldRoute = `app.get('/.well-known/mcp-registry-auth', (req, res) => res.sendFile(__dirname + '/public/.well-known/mcp-registry-auth'));`;
const newRoute = `app.get('/.well-known/mcp-registry-auth', (req, res) => { res.type('txt').send(fs.readFileSync(__dirname + '/public/.well-known/mcp-registry-auth', 'utf8')); });`;

if (code.includes(oldRoute)) {
  code = code.replace(oldRoute, newRoute);
  fs.writeFileSync(path, code, 'utf8');
  console.log('ROUTE_UPDATED');
} else {
  // Try adding it fresh
  const target = `app.get("/.well-known/x402", (req, res) => res.sendFile(__dirname + "/public/.well-known/x402"));`;
  if (code.includes(target) && !code.includes('mcp-registry-auth')) {
    code = code.replace(target, target + '\n' + newRoute);
    fs.writeFileSync(path, code, 'utf8');
    console.log('ROUTE_ADDED');
  } else {
    console.log('ROUTE_ALREADY_CORRECT');
  }
}

// Verify the file
const authFile = '/opt/goldbean/public/.well-known/mcp-registry-auth';
fs.writeFileSync(authFile, 'MCowBQYDK2VwAyEAIShVJHtwT7dE7QlMkejvyqgyjICqb9G5iQuhBrmufMM=', 'utf8');
console.log('AUTH_FILE_WRITTEN');

// Test quickly
try {
  const content = fs.readFileSync(authFile, 'utf8');
  console.log('VERIFY:', content);
} catch(e) {
  console.log('VERIFY_FAIL:', e.message);
}
