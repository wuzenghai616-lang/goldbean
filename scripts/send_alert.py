#!/usr/bin/env python3
"""
GoldBean Alert Sender - sends critical alerts to webhook/Telegram
Reads alerts JSON and sends via configured channel
"""

import json
import sys
import os
import urllib.request

# Load config
ALERT_FILE = (
    sys.argv[1] if len(sys.argv) > 1 else "/opt/goldbean/maintenance_alerts.json"
)

# Try to load webhook config
WEBHOOK_URL = os.environ.get("GOLDBEAN_ALERT_WEBHOOK", "")
TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID", "")


def send_webhook(alerts):
    if not WEBHOOK_URL:
        return False
    data = json.dumps(
        {
            "source": "GoldBean VPS",
            "timestamp": alerts[-1]["time"] if alerts else "",
            "alert_count": len(alerts),
            "alerts": alerts,
        }
    ).encode()
    try:
        req = urllib.request.Request(
            WEBHOOK_URL, data=data, headers={"Content-Type": "application/json"}
        )
        urllib.request.urlopen(req, timeout=10)
        return True
    except Exception as e:
        print(f"Webhook error: {e}", file=sys.stderr)
        return False


def send_telegram(alerts):
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        return False
    critical = [a for a in alerts if a["level"] == "CRITICAL"]
    if not critical:
        return True
    msg = "[GoldBean VPS Alert]\n"
    for a in critical:
        msg += f"[{a['level']}] {a['msg']}\n"
    msg += f"\nTime: {critical[-1]['time']}"
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    data = json.dumps({"chat_id": TELEGRAM_CHAT_ID, "text": msg}).encode()
    try:
        req = urllib.request.Request(
            url, data=data, headers={"Content-Type": "application/json"}
        )
        urllib.request.urlopen(req, timeout=10)
        return True
    except Exception as e:
        print(f"Telegram error: {e}", file=sys.stderr)
        return False


def main():
    try:
        with open(ALERT_FILE) as f:
            alerts = json.load(f)
    except:
        alerts = []

    critical = [a for a in alerts if a["level"] == "CRITICAL"]
    if not critical:
        return

    sent = send_webhook(critical)
    sent_tg = send_telegram(critical)
    if not sent and not sent_tg:
        print("No alert channel configured. Alerts saved to file.", file=sys.stderr)


if __name__ == "__main__":
    main()
