# Contributing to GoldBean

Thank you for your interest in contributing to GoldBean! We welcome contributions from everyone — whether you're fixing a bug, adding a feature, improving documentation, or just asking questions.

## Quick Start

1. **Fork** the repository
2. **Clone** your fork locally
3. Create a **branch** for your change: `git checkout -b my-feature`
4. Make your changes and **commit**: `git commit -m "Add my feature"`
5. **Push** to your fork: `git push origin my-feature`
6. Open a **Pull Request** against the `main` branch

## Ways to Contribute

### Bug Reports
- Open an issue with a clear title and description
- Include steps to reproduce, expected behavior, and actual behavior
- Tag it with the `bug` label

### Documentation
- Fix typos, clarify instructions, or add examples
- Documentation PRs are always welcome and have low review friction

### Code Contributions
- Look for issues tagged `good-first-issue` for beginner-friendly tasks
- Look for issues tagged `help-wanted` for more complex tasks
- Follow existing code style and patterns

### New Endpoints / Tools
- If you want to add a new Baidu AI endpoint wrapper, please:
  - Check the existing tool structure in `server-v740-bazaar.js` or `mcp-server-full.js`
  - Add the tool definition to the MCP tools array
  - Add the corresponding handler function
  - Test with `npx goldbean-mcp` before submitting

### Community Promotion
- Share GoldBean in your community, blog, or social media
- Submit GoldBean to relevant awesome-lists or directories
- Write tutorials or demo videos

## Code Style

- JavaScript (Node.js) for the MCP server
- Keep functions concise and well-named
- Add comments for complex logic
- Maintain consistency with existing patterns

## Testing

Before submitting a PR:
- Run `npx goldbean-mcp` locally to verify the server starts
- Test your specific endpoint/tool change
- Verify no existing tools are broken

## Pull Request Guidelines

- **Title**: Use a clear, descriptive title (e.g., "Add face comparison OCR endpoint")
- **Description**: Explain what the change does, why it's needed, and how it was tested
- **Size**: Keep PRs small and focused — one change per PR is ideal
- **Commits**: Use meaningful commit messages

## Community Standards

- Be respectful and constructive in all interactions
- Follow the GitHub Community Guidelines
- Help others when you can — we're all learning together

## Questions?

- Open a [GitHub Discussion](https://github.com/wuzenghai616-lang/goldbean/discussions) for general questions
- Open an [Issue](https://github.com/wuzenghai616-lang/goldbean/issues/new) for bug reports or feature requests

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

*GoldBean is an open-source project. Every contribution counts — even fixing a typo.*
