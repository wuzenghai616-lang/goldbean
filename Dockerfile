# Start with a lightweight Node.js image
FROM node:20-alpine

# Create and set working directory
WORKDIR /app

# Install the goldbean-mcp npm package globally
RUN npm install -g goldbean-mcp@0.2.3

# Expose port (required by Smithery container runtime)
EXPOSE 8081

# Start the MCP server in stdio mode (Smithery handles the connection)
# The server outputs tools/list capabilities via stdio protocol
CMD ["npx", "-y", "goldbean-mcp"]
