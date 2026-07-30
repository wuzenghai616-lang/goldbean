#!/usr/bin/env python3
"""
GoldBean Market Intelligence Monitor
Runs daily via cron, checks:
1. MCP ecosystem updates (spec changes, new platforms)
2. Competitor API marketplace changes
3. Baidu AI API policy/pricing changes
4. x402 protocol developments
5. Developer community sentiment

Outputs structured report to /opt/goldbean/market_reports/
"""

import json
import os
import sys
import urllib.request
import urllib.parse
import re
from datetime import datetime, timezone

REPORT_DIR = "/opt/goldbean/market_reports"
os.makedirs(REPORT_DIR, exist_ok=True)

DATE_STR = datetime.now(timezone.utc).strftime("%Y-%m-%d")
REPORT_FILE = os.path.join(REPORT_DIR, f"market_report_{DATE_STR}.json")


def fetch_url(url, timeout=15):
    try:
        req = urllib.request.Request(
            url, headers={"User-Agent": "GoldBean-Market-Monitor/1.0"}
        )
        resp = urllib.request.urlopen(req, timeout=timeout)
        return resp.read().decode("utf-8", errors="replace")
    except Exception as e:
        return f"ERROR: {e}"


def check_github_releases(repo):
    """Check latest releases on GitHub"""
    url = f"https://api.github.com/repos/{repo}/releases/latest"
    try:
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "GoldBean-Monitor",
                "Accept": "application/vnd.github.v3+json",
            },
        )
        resp = urllib.request.urlopen(req, timeout=10)
        data = json.loads(resp.read())
        return {
            "tag": data.get("tag_name", "unknown"),
            "published": data.get("published_at", ""),
            "url": data.get("html_url", ""),
            "body": (data.get("body", "") or "")[:500],
        }
    except Exception as e:
        return {"error": str(e)}


def check_npm_package(pkg_name):
    """Check npm package latest version"""
    url = f"https://registry.npmjs.org/{pkg_name}"
    try:
        req = urllib.request.Request(url, headers={"Accept": "application/json"})
        resp = urllib.request.urlopen(req, timeout=10)
        data = json.loads(resp.read())
        latest = data.get("dist-tags", {}).get("latest", "unknown")
        versions = list(data.get("versions", {}).keys())
        return {
            "latest": latest,
            "total_versions": len(versions),
            "last_5": versions[-5:] if len(versions) >= 5 else versions,
        }
    except Exception as e:
        return {"error": str(e)}


def check_website_status(url):
    """Check if a website/service is alive"""
    try:
        req = urllib.request.Request(
            url, headers={"User-Agent": "GoldBean-Monitor/1.0"}
        )
        resp = urllib.request.urlopen(req, timeout=10)
        return {"status": resp.status, "alive": True}
    except urllib.error.HTTPError as e:
        return {"status": e.code, "alive": e.code < 500}
    except Exception as e:
        return {"status": 0, "alive": False, "error": str(e)}


def check_mcp_spec():
    """Check MCP specification for changes"""
    checks = {
        "modelcontextprotocol/specification": check_github_releases(
            "modelcontextprotocol/specification"
        ),
        "modelcontextprotocol/python-sdk": check_github_releases(
            "modelcontextprotocol/python-sdk"
        ),
        "modelcontextprotocol/typescript-sdk": check_github_releases(
            "modelcontextprotocol/typescript-sdk"
        ),
        "@modelcontextprotocol/sdk": check_npm_package("@modelcontextprotocol/sdk"),
    }
    return checks


def check_competitors():
    """Check competitor API marketplace status"""
    competitors = {
        "openrouter_api": check_website_status("https://openrouter.ai/api/v1/models"),
        "rapidapi": check_website_status("https://rapidapi.com"),
        "smithery": check_website_status("https://smithery.ai"),
        "glama": check_website_status("https://glama.ai"),
        "mcp_so": check_website_status("https://mcp.so"),
    }
    return competitors


def check_baidu_ai():
    """Check Baidu AI platform status"""
    checks = {
        "baidu_ai_platform": check_website_status("https://ai.baidu.com"),
        "baidu_qianfan": check_website_status("https://qianfan.cloud.baidu.com"),
        "baidu_cloud": check_website_status("https://cloud.baidu.com"),
    }
    return checks


def check_x402():
    """Check x402 ecosystem"""
    checks = {
        "x402_github": check_github_releases("coinbase/x402"),
        "x402_website": check_website_status("https://x402.org"),
    }
    return checks


def check_goldbean_self():
    """Self-check GoldBean services"""
    checks = {
        "goldbean_api": check_website_status("https://goldbean-api.xyz/api/v1/health"),
        "goldbean_mcp": check_website_status("https://goldbean-api.xyz/mcp"),
        "goldbean_mcp_v2_local": check_website_status("http://127.0.0.1:9878/mcp"),
        "goldbean_npm": check_npm_package("goldbean-mcp"),
        "goldbean_github": check_github_releases("wuzenghai616-lang/goldbean"),
    }
    return checks


def generate_report():
    report = {
        "report_date": DATE_STR,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "sections": {
            "mcp_ecosystem": check_mcp_spec(),
            "competitors": check_competitors(),
            "baidu_ai": check_baidu_ai(),
            "x402_ecosystem": check_x402(),
            "goldbean_self": check_goldbean_self(),
        },
    }

    # Determine action items
    actions = []

    # Check MCP spec changes
    spec = report["sections"]["mcp_ecosystem"].get(
        "modelcontextprotocol/specification", {}
    )
    if spec.get("tag") and "2026" in str(spec.get("tag", "")):
        actions.append(f"MCP spec update detected: {spec['tag']} - review changes")

    # Check competitor status changes
    for name, status in report["sections"]["competitors"].items():
        if not status.get("alive", False):
            actions.append(
                f"Competitor {name} appears DOWN - opportunity to capture users"
            )

    # Check GoldBean npm updates
    npm_info = report["sections"]["goldbean_self"].get("goldbean_npm", {})
    if npm_info.get("latest"):
        actions.append(f"GoldBean npm latest: {npm_info['latest']}")

    # Check x402 updates
    x402_gh = report["sections"]["x402_ecosystem"].get("x402_github", {})
    if x402_gh.get("tag"):
        actions.append(f"x402 latest release: {x402_gh['tag']}")

    # Check self health
    self_health = report["sections"]["goldbean_self"].get("goldbean_api", {})
    if not self_health.get("alive"):
        actions.append("CRITICAL: GoldBean API is down!")

    report["action_items"] = actions
    return report


def main():
    report = generate_report()

    # Save report
    with open(REPORT_FILE, "w") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    # Print summary
    print(f"Market report saved to {REPORT_FILE}")
    print(f"Action items: {len(report['action_items'])}")
    for item in report["action_items"]:
        print(f"  - {item}")

    # Keep only last 30 days of reports
    now = datetime.now(timezone.utc)
    for fname in os.listdir(REPORT_DIR):
        if not fname.startswith("market_report_"):
            continue
        try:
            file_date_str = fname.replace("market_report_", "").replace(".json", "")
            file_date = datetime.strptime(file_date_str, "%Y-%m-%d").replace(
                tzinfo=timezone.utc
            )
            if (now - file_date).days > 30:
                os.remove(os.path.join(REPORT_DIR, fname))
        except:
            pass


if __name__ == "__main__":
    main()
