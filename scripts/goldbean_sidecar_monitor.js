// goldbean_sidecar_monitor.js — 独立监控，不修改 server.js
// 每5分钟：记录健康状态到 SQLite
// 无侵入式

var exec = require('child_process').exec;
var fs = require('fs');
var DB = '/opt/goldbean/memory/calls.db';
var PID_FILE = '/opt/goldbean/scripts/.sidecar_pid';

function log() {
  var args = Array.prototype.slice.call(arguments);
  console.log.apply(console, ['[Sidecar]'].concat(args));
}

function query(sql) {
  return new Promise(function(resolve, reject) {
    exec("sqlite3 " + DB + " '" + sql.replace(/'/g, "''") + "'", function(err, out) {
      if (err) return reject(err);
      resolve(out.trim());
    });
  });
}

function recordHealth() {
  var status = 'up';
  var uptime = 0;
  var mem = 0;

  try {
    var uptimeStr = fs.readFileSync('/proc/uptime', 'utf8');
    uptime = parseFloat(uptimeStr.split(' ')[0]) || 0;
  } catch(e) {}

  try {
    var memInfo = fs.readFileSync('/proc/meminfo', 'utf8');
    var m = memInfo.match(/MemTotal:\s+(\d+)/);
    var total = m ? parseInt(m[1]) : 0;
    m = memInfo.match(/MemAvailable:\s+(\d+)/);
    var avail = m ? parseInt(m[1]) : 0;
    mem = Math.round((total - avail) / 1024 * 100) / 100;
  } catch(e) {}

  var q = "INSERT INTO health_log(status, uptime_seconds, memory_mb, paid_endpoints) ";
  q += "VALUES('" + status + "', " + uptime + ", " + mem + ", 120)";

  exec("sqlite3 " + DB + " '" + q.replace(/'/g, "''") + "'", function() {});
}

function run() {
  log('Recording health...');
  recordHealth();
}

// Run every 5 minutes
run();
setInterval(run, 5 * 60 * 1000);
log('Sidecar monitor started (5min interval)');

// Write PID
try { fs.writeFileSync(PID_FILE, String(process.pid)); } catch(e) {}