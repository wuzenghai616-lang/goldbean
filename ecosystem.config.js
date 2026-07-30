module.exports = {
  apps: [
    {
      name: "goldbean-server",
      script: "server.js",
      cwd: "/opt/goldbean",
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      env: { NODE_ENV: "production", PORT: 9879 }
    },
    {
      name: "goldbean-mcp-http",
      script: "goldbean_mcp_http.js",
      cwd: "/opt/goldbean",
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      env: { NODE_ENV: "production" }
    },
    {
      name: "goldbean-free-endpoints",
      script: "standalone-free-endpoints.js",
      cwd: "/opt/goldbean",
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      env: { NODE_ENV: "production", FREE_PORT: 9880 }
    },
    {
      name: "goldbean-http-proxy",
      script: "http_proxy.js",
      cwd: "/opt/goldbean",
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      env: { NODE_ENV: "production" }
    },
    {
      name: "goldbean-socks-proxy",
      script: "socks_proxy.js",
      cwd: "/opt/goldbean",
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      env: { NODE_ENV: "production" }
    },
    {
      name: "goldbean-monitor",
      script: "monitor/vps_monitor_v2.js",
      cwd: "/opt/goldbean",
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      env: { NODE_ENV: "production" }
    }
  ]
};
