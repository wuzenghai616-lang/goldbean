#!/bin/bash
# GoldBean VPS Auto-Maintenance Script
# Runs every hour via cron
# Checks: service health, SSL cert, disk space, memory, PM2 processes, dependency updates

set -euo pipefail
LOG="/opt/goldbean/maintenance.log"
ALERT_FILE="/opt/goldbean/maintenance_alerts.json"
DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

log() { echo "[$DATE] $1" >> "$LOG"; }

# Initialize alerts file
if [ ! -f "$ALERT_FILE" ]; then
  echo '[]' > "$ALERT_FILE"
fi

ALERTS="[]"
add_alert() {
  local level="$1" msg="$2"
  ALERTS=$(echo "$ALERTS" | python3 -c "
import json,sys
a=json.load(sys.stdin)
a.append({'time':'$DATE','level':'$level','msg':'$msg'})
print(json.dumps(a))
")
  log "[$level] $msg"
}

# 1. Check service health (main API)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://127.0.0.1:9879/health 2>/dev/null || echo "000")
if [ "$HTTP_CODE" != "200" ]; then
  add_alert "CRITICAL" "Main API health check failed: HTTP $HTTP_CODE"
  # Auto-restart
  pm2 restart goldbean-server --update-env 2>/dev/null || true
  log "Auto-restarted goldbean-server"
fi

# 2. Check MCP v2 endpoint
MCP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 -X POST http://127.0.0.1:9878/mcp -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' 2>/dev/null || echo "000")
if [ "$MCP_CODE" != "200" ]; then
  add_alert "CRITICAL" "MCP v2 endpoint check failed: HTTP $MCP_CODE"
  pm2 restart goldbean-mcp-http --update-env 2>/dev/null || true
  log "Auto-restarted goldbean-mcp-http"
fi

# 3. Check free endpoints
FREE_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://127.0.0.1:9880/ 2>/dev/null || echo "000")
if [ "$FREE_CODE" = "000" ]; then
  add_alert "WARNING" "Free endpoints service unreachable"
  pm2 restart goldbean-free-endpoints --update-env 2>/dev/null || true
fi

# 4. Check SSL certificate expiry
CERT_EXPIRY=$(echo | openssl s_client -servername goldbean-api.xyz -connect 127.0.0.1:443 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2 || echo "")
if [ -n "$CERT_EXPIRY" ]; then
  EXPIRY_EPOCH=$(date -d "$CERT_EXPIRY" +%s 2>/dev/null || echo 0)
  NOW_EPOCH=$(date +%s)
  DAYS_LEFT=$(( (EXPIRY_EPOCH - NOW_EPOCH) / 86400 ))
  if [ "$DAYS_LEFT" -lt 14 ]; then
    add_alert "WARNING" "SSL certificate expires in $DAYS_LEFT days ($CERT_EXPIRY)"
    if [ "$DAYS_LEFT" -lt 7 ]; then
      log "Triggering SSL renewal..."
      /root/.acme.sh/acme.sh --force --renew -d goldbean-api.xyz --ecc 2>/dev/null || true
      nginx -s reload 2>/dev/null || true
    fi
  fi
fi

# 5. Check disk space
DISK_PCT=$(df / | tail -1 | awk '{print $5}' | tr -d '%')
if [ "$DISK_PCT" -gt 85 ]; then
  add_alert "WARNING" "Disk usage at ${DISK_PCT}%"
  # Clean old PM2 logs
  find /root/.pm2/logs/ -name "*.log" -mtime +7 -exec truncate -s 0 {} \; 2>/dev/null || true
  log "Cleaned PM2 logs older than 7 days"
fi
if [ "$DISK_PCT" -gt 95 ]; then
  add_alert "CRITICAL" "Disk usage at ${DISK_PCT}% - critical!"
fi

# 6. Check memory
MEM_PCT=$(free | awk '/Mem:/ {printf "%.0f", $3/$2*100}')
if [ "$MEM_PCT" -gt 85 ]; then
  add_alert "WARNING" "Memory usage at ${MEM_PCT}%"
  # Clear page cache
  sync && echo 1 > /proc/sys/vm/drop_caches 2>/dev/null || true
  log "Cleared page cache"
fi
if [ "$MEM_PCT" -gt 95 ]; then
  add_alert "CRITICAL" "Memory usage at ${MEM_PCT}% - critical!"
fi

# 7. Check PM2 process count
PM2_COUNT=$(pm2 list --no-colors 2>/dev/null | grep -c "online" || echo "0")
PM2_STOPPED=$(pm2 list --no-colors 2>/dev/null | grep -cE "stopped|errored" || true)
PM2_STOPPED=${PM2_STOPPED//[^0-9]/}
PM2_STOPPED=${PM2_STOPPED:-0}
if [ "$PM2_STOPPED" -gt 0 ] 2>/dev/null; then
  add_alert "WARNING" "$PM2_STOPPED PM2 process(es) stopped/errored"
  pm2 resurrect 2>/dev/null || true
fi

# 8. Check npm dependencies for security vulnerabilities (weekly)
DOW=$(date +%u)
if [ "$DOW" = "1" ]; then
  cd /opt/goldbean
  NPM_AUDIT=$(npm audit --json 2>/dev/null | python3 -c "
import json,sys
try:
  d=json.load(sys.stdin)
  v=d.get('metadata',{}).get('vulnerabilities',{})
  print(f\"high:{v.get('high',0)} critical:{v.get('critical',0)}\")
except:
  print('error')
" 2>/dev/null || echo "error")
  if [ "$NPM_AUDIT" != "error" ]; then
    HIGH=$(echo "$NPM_AUDIT" | grep -oP 'high:\K[0-9]+')
    CRITICAL=$(echo "$NPM_AUDIT" | grep -oP 'critical:\K[0-9]+')
    if [ "${CRITICAL:-0}" -gt 0 ]; then
      add_alert "WARNING" "npm audit: $CRITICAL critical vulnerabilities"
    fi
  fi
fi

# 9. Rotate maintenance log (keep 7 days)
find /opt/goldbean/ -name "maintenance.log" -size +1M -exec truncate -s 500K {} \; 2>/dev/null || true

# Save alerts
echo "$ALERTS" > "$ALERT_FILE"

# Summary
TOTAL_ALERTS=$(echo "$ALERTS" | python3 -c "import json,sys; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")
CRITICAL_COUNT=$(echo "$ALERTS" | python3 -c "import json,sys; print(sum(1 for a in json.load(sys.stdin) if a['level']=='CRITICAL'))" 2>/dev/null || echo "0")
log "Maintenance complete. Alerts: $TOTAL_ALERTS (Critical: $CRITICAL_COUNT)"

# If critical alerts, send to webhook
if [ "$CRITICAL_COUNT" -gt 0 ]; then
  python3 /opt/goldbean/scripts/send_alert.py "$ALERT_FILE" 2>/dev/null || true
fi
