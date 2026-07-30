const fs = require("fs");
const src = fs.readFileSync("server.js","utf8");
const routes = new Set();
// Match: app.get("/path",  app.post('/path',  app.get(`/path`
const re = /app\.(get|post|put|delete|all)\(('|"|`)([^'"`]+)\2/g;
let m;
while ((m = re.exec(src)) !== null) routes.add(m[1].toUpperCase() + " " + m[3]);
const s = [...routes].sort();
console.log("=== 实际 server.js 路由 ===");
s.forEach(r => console.log("  " + r));
console.log("");
console.log("总计: " + s.length + " 路由");
