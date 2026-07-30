#!/usr/bin/env python3
"""Generate a clean openapi.json containing ONLY real server routes."""

import re
import json
import os

def extract_routes(server_file):
    """Extract (method, path) tuples from a Node.js/Express server file."""
    routes = set()
    with open(server_file) as f:
        code = f.read()
    # app.get, app.post, etc.
    for m in re.finditer(r'app\.(get|post|put|delete|patch)\(["\']([^"\']+)["\']', code):
        routes.add((m.group(1).upper(), m.group(2)))
    # router.get, router.post, etc.
    for m in re.finditer(r'router\.(get|post|put|delete|patch)\(["\']([^"\']+)["\']', code):
        routes.add((m.group(1).upper(), m.group(2)))
    return routes

# Extract routes from all three server files
real_routes = set()
for f in ['/opt/goldbean/server.js', '/opt/goldbean/free-server.js', '/opt/goldbean/standalone-free-endpoints.js']:
    if os.path.exists(f):
        real_routes.update(extract_routes(f))

# Define free/paywall routes
FREE_PATHS = {
    '/', '/health', '/openapi.json', '/debug', '/info',
    '/favicon.ico', '/robots.txt', '/sitemap.xml', '/llms.txt',
    '/ocr-demo', '/btc-price', '/gas', '/weather-now',
    '/alipay/query', '/api/routes', '/api/pricing/plans', '/api/pricing/endpoint',
    '/user/credits', '/x402-endpoint', '/v1/models',
    '/.well-known/x402', '/.well-known/x402-bazaar', '/.well-known/mcp-registry-auth',
}

# Build openapi paths dict
openapi_paths = {}
for method, path in sorted(real_routes):
    if path not in openapi_paths:
        openapi_paths[path] = {}
    
    # Determine security
    is_free = path in FREE_PATHS
    
    entry = {
        "summary": path.replace("/", " ").strip() or "root",
        "operationId": f"{method.lower()}_{path.replace('/', '_').strip('_') or 'root'}",
        "responses": {
            "200": {"description": "Success"}
        }
    }
    
    if is_free:
        entry["security"] = []
    
    if not is_free and method == "GET":
        entry["parameters"] = [{
            "name": "params",
            "in": "query",
            "required": False,
            "schema": {"type": "object"}
        }]
    
    openapi_paths[path][method.lower()] = entry

# Build full openapi spec
openapi = {
    "openapi": "3.0.3",
    "info": {
        "title": "GoldBean API",
        "version": "8.0.0",
        "description": "Pay-per-use AI API Marketplace. 44 routes total.",
        "contact": {"email": "wuzenghai616@gmail.com"}
    },
    "servers": [{"url": "https://goldbean-api.xyz"}],
    "paths": openapi_paths
}

# Write to both locations
for fp in ['/opt/goldbean/public/openapi.json', '/opt/goldbean/openapi.json']:
    with open(fp, 'w') as f:
        json.dump(openapi, f, indent=2)
    print(f"Written: {fp} ({len(openapi_paths)} paths)")

# Verify
import urllib.request
for target in ['/openapi.json']:
    try:
        req = urllib.request.Request(f"http://127.0.0.1:9879{target}")
        with urllib.request.urlopen(req, timeout=3) as resp:
            data = json.loads(resp.read())
            print(f"Verify local: {target} → {len(data.get('paths', {}))} paths")
    except Exception as e:
        print(f"Verify local: {target} → {e}")

print("\n=== Route breakdown ===")
paid = [p for p in openapi_paths if p not in FREE_PATHS]
free = [p for p in openapi_paths if p in FREE_PATHS]
print(f"Free: {len(free)}")
print(f"Paid: {len(paid)}")
print(f"Total: {len(openapi_paths)}")
print(f"\nFree paths: {sorted(free)}")
print(f"\nPaid paths: {sorted(paid)}")
