# GoldBean MCP Server - Smithery Container Runtime
# https://smithery.ai/docs/build/container
FROM node:20-alpine

WORKDIR /app

# Pre-install goldbean-mcp for faster startup
RUN npm install -g goldbean-mcp@0.2.3

# Smithery expects the startCommand to run inside the container
# The command is defined in smithery.yaml (commandFunction)
CMD ["npx", "-y", "goldbean-mcp"]
