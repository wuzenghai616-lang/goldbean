# GoldBean MCP Server - Smithery Container Runtime
# https://smithery.ai/docs/build/container
FROM node:20-alpine

WORKDIR /app

# Pre-install goldbean-mcp so it's available as a command inside the container
RUN npm install -g goldbean-mcp@0.2.3

# CMD must match the commandFunction in smithery.yaml:
# commandFunction returns: { command: 'goldbean-mcp', args: [] }
# Smithery starts the container and then connects to stdio
CMD ["goldbean-mcp"]
