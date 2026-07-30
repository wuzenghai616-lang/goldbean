#!/usr/bin/env node
/**
 * GoldBean Revenue Report
 * Reads call.log, calculates daily revenue, saves to revenue.json
 * Run daily at 22:00 via crontab
 */
const F=require("fs");
const LO="/opt/goldbean/memory/call.log";
const RI="/opt/goldbean/memory/revenue.json";
const LOGDIR="/opt/goldbean/memory/reports";

if(!F.existsSync(LO)){console.log("No call.log");process.exit(0)}
if(!F.existsSync(LOGDIR)) F.mkdirSync(LOGDIR,{recursive:true});

// Read log
var log=F.readFileSync(LO,"utf8").trim().split("\n").filter(Boolean);

// Today's date as YYYY-MM-DD
var now=new Date();
var today=now.toISOString().slice(0,10);
var yesterday=new Date(now.getTime()-86400000).toISOString().slice(0,10);

// Parse all REF entries
var refs={};
var totalRefCalls=0;
log.forEach(function(l){
  var p=l.split(",");
  if(p[0]==="REF"){
    var ref=p[2];var ep=p[3];var pr=parseFloat(p[4])||0;var ip=p[5]||"";
    if(!refs[ref]) refs[ref]={calls:0,eps:{},ips:{}};
    refs[ref].calls++;
    totalRefCalls++;
    if(!refs[ref].eps[ep]) refs[ref].eps[ep]=0;
    refs[ref].eps[ep]++;
    if(!refs[ref].ips[ip]) refs[ref].ips[ip]=0;
    refs[ref].ips[ip]++;
  }
});

// Parse today's call log entries
var todayCalls=[];var todayRevenue=0;
var yesterdayCalls=[];var yesterdayRevenue=0;
var allTimeCalls=[];var allTimeRevenue=0;
var epStats={};

log.forEach(function(l){
  var p=l.split(",");
  if(p.length<3)return;
  var ts=p[0];var ep=p[1];var pr=parseFloat(p[2])||0;var ip=(p[3]||"").trim();
  var date=ts.slice(0,10);
  var isBot=(ip==="127.0.0.1"||ip==="::1"||ip==="localhost");
  var actual_pr=isBot?0:pr; // Bot calls don't count as real revenue
  
  var entry={ts:ts,ep:ep,pr:actual_pr,ip:ip,bot:isBot};
  allTimeCalls.push(entry);
  if(!isBot) allTimeRevenue+=actual_pr;
  
  if(date===today){todayCalls.push(entry);if(!isBot)todayRevenue+=actual_pr}
  if(date===yesterday){yesterdayCalls.push(entry);if(!isBot)yesterdayRevenue+=actual_pr}
  
  if(!epStats[ep]) epStats[ep]={count:0,botCount:0,revenue:0};
  if(isBot){epStats[ep].botCount++}else{epStats[ep].count++;epStats[ep].revenue+=actual_pr}
});

// Previous daily report for trend
var prev={};
try{prev=JSON.parse(F.readFileSync(RI,"utf8"))}catch(e){}

// Fees
var paidCalls=todayCalls.filter(function(e){return e.pr>0&&!e.bot});
var botCalls=todayCalls.filter(function(e){return e.bot});
var subCalls=todayCalls.filter(function(e){return e.ep.indexOf("0(sub)")>=0});

var report={
  date:today,
  generated_at:now.toISOString(),
  summary:{
    all_time:{calls:allTimeCalls.length,revenue_usd:parseFloat(allTimeRevenue.toFixed(4)),ref_calls:totalRefCalls},
    yesterday:{calls:yesterdayCalls.length,revenue_usd:parseFloat(yesterdayRevenue.toFixed(4))},
    today:{calls:todayCalls.length,revenue_usd:parseFloat(todayRevenue.toFixed(4))},
    paid_calls:paidCalls.length,
    bot_calls:botCalls.length,
    sub_calls:subCalls.length
  },
  top_endpoints:Object.keys(epStats).sort(function(a,b){return epStats[b].revenue-epStats[a].revenue}).slice(0,10).map(function(k){return{ep:k,count:epStats[k].count,bot_count:epStats[k].botCount,revenue:parseFloat(epStats[k].revenue.toFixed(4))}}),
  referrals:{count:Object.keys(refs).length,total_calls:totalRefCalls,top_refs:Object.keys(refs).sort(function(a,b){return refs[b].calls-refs[a].calls}).slice(0,5).map(function(k){return{ref:k,calls:refs[k].calls,tiers:k.indexOf("g_")===0?"gold":k.indexOf("s_")===0?"silver":"bronze"}})},
  trend:{prev_total_revenue:prev.summary?prev.summary.all_time.revenue_usd:0,new_calls_since_prev:allTimeCalls.length-(prev.summary?prev.summary.all_time.calls:0)}
};

// Save daily report to file
F.writeFileSync(LOGDIR+"/"+today+".json",JSON.stringify(report,null,2),"utf8");
// Update main revenue.json
F.writeFileSync(RI,JSON.stringify(report,null,2),"utf8");

// Also save a simple plain-text version for notification
var txt=[];
txt.push("🫘 GoldBean 每日营收报告 — "+today);
txt.push("━━━━━━━━━━━━━━━━━━");
txt.push("📊 总览");
txt.push("  累计调用: "+allTimeCalls.length+" 次");
txt.push("  累计营收: $"+allTimeRevenue.toFixed(4));
txt.push("  昨日调用: "+yesterdayCalls.length+" 次");
txt.push("  昨日营收: $"+yesterdayRevenue.toFixed(4));
txt.push("  今日调用: "+todayCalls.length+" 次");
txt.push("  今日营收: $"+todayRevenue.toFixed(4));
txt.push("  付费调用: "+paidCalls.length+" 次");
txt.push("  Bot 调用: "+botCalls.length+" 次");
txt.push("  订阅调用: "+subCalls.length+" 次");
txt.push("");
txt.push("🏆 Top 5 实收端点");
var realEps=Object.keys(epStats).filter(function(k){return epStats[k].revenue>0}).sort(function(a,b){return epStats[b].revenue-epStats[a].revenue}).slice(0,5);
if(realEps.length===0) txt.push("  (暂无实收调用)");
else realEps.forEach(function(k){
  txt.push("  "+k+" → 实收 $"+epStats[k].revenue.toFixed(4)+" / 调用"+epStats[k].count+" 次 (Bot "+epStats[k].botCount+")");
});
txt.push("");
txt.push("🔄 推荐统计");
txt.push("  总推荐调用: "+totalRefCalls+" 次");
txt.push("  推荐人: "+Object.keys(refs).length+" 个");
txt.push("");
txt.push("💰 链上余额（需手动拉取）");
txt.push("  上次记录: "+(prev.eth_balance?prev.eth_balance:"N/A")+" ETH / "+(prev.usdc_balance?prev.usdc_balance:"N/A")+" USDC");

var txtReport=txt.join("\n");
F.writeFileSync(LOGDIR+"/"+today+"_text.txt",txtReport,"utf8");
console.log(txtReport);
console.log("\nReport saved to "+RI);
