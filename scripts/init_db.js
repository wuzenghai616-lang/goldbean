
var D=require('better-sqlite3');
var db=new D('/opt/goldbean/memory/calls.db');
db.exec(require('fs').readFileSync('/dev/stdin','utf8'));
var tables=db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:',tables.map(function(t){return t.name}).join(', '));
db.close();
