import re
import json

# Read server.js
with open("/opt/goldbean/server.js") as f:
    code = f.read()

# Extract all app.get/app.post routes
patterns = [
    r'app\.(get|post|put|delete|patch)\(["\']([^"\']+)["\']',
    r'router\.(get|post|put|delete|patch)\(["\']([^"\']+)["\']',
]

all_routes = set()
for pat in patterns:
    for m in re.finditer(pat, code):
        method = m.group(1)
        path = m.group(2)
        if path.startswith("/.well-known/"):
            continue
        all_routes.add((method.upper(), path))

# Also add free-server routes
with open("/opt/goldbean/free-server.js") as f:
    free_code = f.read()

for m in re.finditer(r'app\.(get|post)\(["\']([^"\']+)["\']', free_code):
    method = m.group(1)
    path = m.group(2)
    all_routes.add((method.upper(), path))

# Read openapi.json
with open("/opt/goldbean/public/openapi.json") as f:
    openapi = json.load(f)

openapi_paths = set(openapi.get("paths", {}).keys())

# Print real routes
print("=== Real server routes (sorted) ===")
for method, path in sorted(all_routes):
    print(f"  {method} {path}")
print(f"\nTotal (method,path): {len(all_routes)}")

# Clean paths (grouped)
real_paths = set()
for method, path in all_routes:
    clean_path = re.sub(r"/:[^/]+", "/{param}", path)
    real_paths.add(clean_path)

print(f"\n=== Grouped paths ===")
for p in sorted(real_paths):
    print(f"  {p}")
print(f"Total grouped: {len(real_paths)}")
