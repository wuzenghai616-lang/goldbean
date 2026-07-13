# Contributing to GoldBean

First off, thanks for taking the time to contribute! 🫘

GoldBean is an open-source project that gives global developers access to Baidu AI endpoints via micropayments (USDC, PayPal, Alipay). All contributions — bug reports, feature requests, code, docs, or spreading the word — are welcome.

---

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please be respectful and constructive in all interactions.

---

## How You Can Help

| Area | Examples |
|------|----------|
| Bug Reports | Found a broken endpoint or unexpected response? [Open an issue](https://github.com/wuzenghai616-lang/goldbean/issues/new?template=bug_report.yml). |
| Feature Requests | New Baidu AI endpoint, MCP tool, or payment method? [Suggest it](https://github.com/wuzenghai616-lang/goldbean/issues/new?template=feature_request.yml). |
| Code | Fix bugs, add endpoints, improve error handling, optimize performance. |
| Documentation | Improve README, add examples, fix typos. |
| Community | Answer questions in Discussions, share GoldBean on social media. |

---

## Before You Start

### Prerequisites

- **Node.js** >= 18 (for running the MCP server)
- **Python** >= 3.10 (for Python examples and SDK)
- **Git** with your GitHub account configured

### Project Structure

```
goldbean/
├── mcp-server-full.js        # Main MCP server (full implementation)
├── server-v740-bazaar.js     # API server (Express, 67 routes)
├── goldbean-bazaar-v740.js   # x402 bazaar & payment layer
├── examples/                  # Code examples (Python, Node.js, configs)
├── docs/                      # Documentation
├── Dockerfile                 # Container deployment
├── .mcp.json                  # MCP configuration
├── server.json                # Server metadata
├── smithery.yaml              # Smithery deployment config
└── glama.json                 # Glama.ai MCP registry config
```

---

## Development Workflow

### 1. Fork & Clone

```bash
git clone https://github.com/YOUR-USERNAME/goldbean.git
cd goldbean
git remote add upstream https://github.com/wuzenghai616-lang/goldbean.git
```

### 2. Create a Branch

Use a descriptive branch name with the appropriate prefix:

```bash
git checkout -b feat/add-baidu-ocr-template
# or
git checkout -b fix/ocr-timeout-error
# or
git checkout -b docs/update-api-endpoints
```

| Prefix | Use For |
|--------|---------|
| `feat/` | New endpoint, tool, or feature |
| `fix/` | Bug fix |
| `docs/` | Documentation only |
| `refactor/` | Code restructuring without behavior change |
| `chore/` | Build, CI, config, dependencies |

### 3. Make Changes

- Follow the existing code style (JavaScript: 2-space indent, single quotes, no semicolons).
- Test your changes locally:

```bash
# Run the MCP server locally
node mcp-server-full.js

# Or test the API server
node server-v740-bazaar.js

# Test Python examples
pip install mcp web3
python examples/quickstart.py
```

- If adding a new API endpoint, update the route registry and README endpoint table.

### 4. Commit

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add baidu table OCR endpoint
fix: handle x402 payment timeout gracefully
docs: add Python SDK quickstart example
refactor: consolidate NLP route handlers
```

### 5. Push & Open a Pull Request

```bash
git push origin feat/add-baidu-ocr-template
```

Then open a PR against the `main` branch. Fill in the [PR template](.github/PULL_REQUEST_TEMPLATE.md) completely.

---

## Pull Request Guidelines

- One feature/fix per PR — keep it focused.
- Link related issues (e.g., `Closes #12`).
- Include test steps or screenshots if applicable.
- Update README.md if you added a new endpoint or changed behavior.
- Don't commit `node_modules/`, `.env`, or credentials.

---

## Adding a New Baidu AI Endpoint

If you're contributing a new API route:

1. Add the route handler in `server-v740-bazaar.js`.
2. Register it in the route registry (`GET /api/routes` output).
3. If it's an MCP tool, add the tool definition in `mcp-server-full.js`.
4. Update the README endpoint table with: route path, price, and description.
5. Add an example call in `examples/quickstart.py` or `examples/quickstart.js`.
6. Test with both free credits and x402 payment.

---

## Reporting Bugs

Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.yml) when opening an issue. Include:

- Endpoint URL and HTTP method
- Request parameters (redact any API keys)
- Expected vs actual response
- Server connection type (Local / Remote MCP / REST)
- Steps to reproduce

**Do not include API keys, wallet private keys, or payment credentials in issues or PRs.**

---

## Suggesting Features

Use the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.yml). Describe:

- The problem you're trying to solve
- Your proposed solution
- Any alternatives you've considered
- Whether you're willing to implement it

---

## Questions & Discussions

For questions that aren't bugs or feature requests, use [GitHub Discussions](https://github.com/wuzenghai616-lang/goldbean/discussions) instead of Issues.

---

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

**GoldBean (GB) — Wishing You Good Fortune & Prosperity 🫘**
