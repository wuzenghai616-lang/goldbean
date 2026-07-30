# GoldBean 推广落地行动计划

> 以下文件已全部创建好，按顺序执行即可上线。

## 已完成的文件清单

```
goldbean/
├── docs/
│   ├── api-reference.html              ← API文档 + 在线测试页面（最重要）
│   ├── mcp-submission.md               ← MCP目录提交材料
│   ├── tutorial-1-baidu-ai-without-chinese-phone.md   ← 推广教程1
│   ├── tutorial-2-quick-start-guide.md                ← 推广教程2
│   └── tutorial-3-ai-workflow-pipeline.md             ← 推广教程3
├── mcp-server-full.js                  ← 扩展版MCP服务器（50+工具）
├── examples/
│   ├── quickstart.py                   ← Python完整SDK示例（新）
│   ├── quickstart.js                   ← Node.js完整SDK示例（新）
│   ├── mcp-integration.py              ← MCP SDK集成示例（重写）
│   └── claude-desktop-config.md        ← Claude Desktop配置指南（更新）
├── README.md                            ← 已修复注册示例
├── smithery.yaml                        ← 已更新描述
└── server.json                          ← MCP服务器元数据
```

## 第一步：部署 API 文档页面（立即可做）

把 `docs/api-reference.html` 上传到服务器，让用户可以访问：

```bash
# 上传到服务器
scp docs/api-reference.html root@104.225.233.23:/opt/goldbean/public/docs.html

# 在 nginx 中添加路由（或直接放到 public 目录）
# 然后通过 https://goldbean-api.xyz/docs 即可访问
```

**效果：** 用户访问 https://goldbean-api.xyz/docs 就能看到完整的 API 文档，并且可以直接在浏览器里测试每一个端点。

## 第二步：部署扩展版 MCP 服务器（立即可做）

当前 MCP 只有 10 个工具，扩展版有 50+ 个：

```bash
# 备份旧版
cp /opt/goldbean/goldbean_mcp_http.js /opt/goldbean/goldbean_mcp_http.js.bak

# 上传新版
scp mcp-server-full.js root@104.225.233.23:/opt/goldbean/goldbean_mcp_http.js

# 重启 MCP 服务
ssh root@104.225.233.23 'systemctl restart goldbean-mcp'
```

**效果：** Cursor / Claude Desktop 用户连接后能看到 50+ 个工具，而不是只有 10 个。

## 第三步：推送代码到 GitHub（立即可做）

```bash
cd goldbean/
git add .
git commit -m "Add: API docs playground, expanded MCP server (50+ tools), tutorials, SDK examples"
git push origin main
```

**效果：** GitHub 仓库更新，README 修复了注册示例，新增了完整 SDK 和教程。

## 第四步：发布推广教程（1-2天内）

### 4.1 Dev.to / Medium 发布文章
把 `tutorial-1-baidu-ai-without-chinese-phone.md` 发布到：
- https://dev.to （已有账号 goldbean）
- https://medium.com

标题建议：**"How to Access Baidu AI APIs Without a Chinese Phone Number (Using MCP)"**

### 4.2 Reddit 发帖
到以下 subreddit 发帖：
- r/MCP — "GoldBean MCP Server: 50+ Baidu AI tools, pay per call with USDC"
- r/OpenAI — "OpenAI-compatible API with Baidu ERNIE + DeepSeek backend"
- r/SideProject — "Built an API gateway for Baidu AI — no Chinese phone number needed"

### 4.3 V2EX / 掘金 / 少数派
翻译成中文版发布：
- V2EX — "做了一个百度AI API转发服务，海外开发者不用中国手机号也能用"
- 掘金 — "用 MCP 协议接入百度 AI：OCR、翻译、ERNIE 大模型"
- 少数派 — "GoldBean：让海外开发者也能用百度 AI"

## 第五步：提交到更多平台（1周内）

### 5.1 MCP 目录提交
用 `docs/mcp-submission.md` 的内容提交到：
- https://github.com/modelcontextprotocol/servers — PR 添加到列表
- https://mcp.directory — 提交服务器
- https://glama.ai — 已收录，更新信息
- https://smithery.ai — 已部署，更新描述

### 5.2 API 市场上架
- https://rapidapi.com — 创建 API listing
- https://apispace.com — 上架
- 阿里云 API 市场 — 上架

### 5.3 GitHub Awesome 列表
提交 PR 到：
- awesome-mcp-servers — 已收录，更新描述
- public-apis — 已收录，更新端点数量
- awesome-x402 — 已收录
- 新增：awesome-ai-tools, awesome-chinese-ai

## 第六步：调整免费额度（可选，需要改服务器代码）

当前：5次/天/IP（不注册），20次（注册）
建议：10次/天/IP（不注册），100次（注册）

修改 `/opt/goldbean/server.js`：
```javascript
// 找到这行
const DAILY_FREE_LIMIT = 5;
// 改为
const DAILY_FREE_LIMIT = 10;

// 注册时找到 freeCredits: 20
// 改为 freeCredits: 100
```

## 预期效果

| 行动 | 预期流量 | 预期转化 |
|------|---------|---------|
| API文档页面上线 | 现有访客转化率提升 2-3x | 注册率提升 |
| MCP工具扩展到50+ | MCP用户调用量提升 5-10x | 付费转化 |
| Dev.to/Reddit教程 | 500-2000 次浏览 | 20-50 注册 |
| GitHub代码更新 | 长尾搜索流量 | 10-30 stars |
| API市场上架 | 被动流量 | 持续增长 |
| 免费额度调整 | 试用用户增加 3-5x | 付费转化提升 |

## 优先级总结

| 优先级 | 事项 | 谁来做 | 耗时 |
|--------|------|--------|------|
| 🔴 P0 | 部署API文档页面 | 上传文件到服务器 | 5分钟 |
| 🔴 P0 | 部署扩展版MCP | 上传文件+重启服务 | 5分钟 |
| 🔴 P0 | 推送GitHub | git push | 2分钟 |
| 🟡 P1 | 发布Dev.to教程 | 复制粘贴发布 | 15分钟 |
| 🟡 P1 | Reddit发帖 | 复制粘贴发布 | 10分钟 |
| 🟡 P1 | 中文社区发帖 | 翻译+发布 | 30分钟 |
| 🟢 P2 | MCP目录提交 | PR提交 | 20分钟 |
| 🟢 P2 | API市场上架 | 填表+配置 | 1小时 |
| 🟢 P2 | 调整免费额度 | 改代码+重启 | 10分钟 |
