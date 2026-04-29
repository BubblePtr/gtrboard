# GTR-Board

GTR-Board 是一个 chat-first AI workspace，用来发现、讨论和评估 GitHub Trending 项目是否适合作为内容选题。

交互产品层由 TanStack Start 承载；夜间发现、研究、评分和长任务生成由 Python services 承载。本仓库当前实现的是 V1 前端产品骨架、TanStack AI 流式聊天端点、可本地运行的 Python discovery pipeline、Cloudflare Workers 部署配置，以及 CodeRabbit 仓库级评审配置。

## V1 功能

V1 从旧项目 `BubblePtr/GTR-Dashboard` 迁移了核心前端体验，并改为当前 TanStack 技术栈的本地状态实现：

- `/` Dashboard：选题统计、最新待审选题、最近 Pipeline 运行。
- `/topics` 选题管理：今日候选/候选池筛选、AI 对话工作台、上下文面板、草稿编辑、采纳/跳过反馈。
- `/pipeline` Pipeline：运行配置、五阶段进度、运行历史。
- `/settings` 设置：用户偏好和 scoring weights 调整。

历史趋势图路由已删除，不提供 `/history`。旧项目的 Python FastAPI 和 SQLModel API 层没有迁入；当前用 `src/lib/gtr-dashboard-store.ts` 表示 V1 前端交互模型，并在 `services/pipeline` 保留可本地运行的 Python pipeline。

## 本次脚手架

项目从 TanStack CLI 生成：

```bash
npx @tanstack/cli@latest create my-tanstack-app --agent --deployment cloudflare --add-ons ai,shadcn,store
```

随后执行：

```bash
npx @tanstack/intent@latest install
npx @tanstack/intent@latest list
```

CLI 交互选择为 React、默认 CLI 工具链、包含 demo/example pages、初始化 Git。CLI 内部依赖安装进度层一度卡住，保留生成结果后在项目内执行了 `npm install --no-audit --no-fund`。

## 运行

```bash
npm install
npm run dev
```

默认开发地址为 `http://localhost:3000`。

### Python Pipeline

默认从 GitHub Trending 拉取项目并跑通五阶段流程。前端也可以在本地 dev 模式下直接触发同一条 Python pipeline，并把结果写入 Pipeline 历史和选题候选池。

```bash
npm run pipeline:run -- --limit 5 --top-n 3
```

如需指定语言，可传入 `--lang`：

```bash
npm run pipeline:run -- --lang python --limit 10
```

在 `/pipeline` 点击“启动 Pipeline”，或在 `/topics` 点击“重新发现”，会直接运行本地 Python pipeline。`npm run pipeline:run` 仍可用于命令行验证，会把本地生成物输出到 `public/pipeline-results/`。

Pipeline 的 profile 和 strategize 阶段会优先使用 OpenAI-compatible Chat Completions 做 LLM 评分与选题生成，读取以下环境变量：

```env
OPENAI_API_KEY=
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
OPENAI_MODEL=qwen3.6-max-preview
```

本地 CLI 会读取 `.env.local`；`.env.loacl` 仅作为早期本地配置 typo 的兼容入口保留，后续应统一迁移到 `.env.local`。如果没有配置 `OPENAI_API_KEY` 或 LLM 调用失败，会降级到本地启发式评分和模板选题，并在 artifact 中标记 `analysis_status=degraded` 或 `generation_status=degraded`。

## 验证

```bash
npm run build
npm run test
npm run pipeline:test
```

## 环境变量

聊天端点 `/api/chat` 会按顺序选择可用 provider：

```env
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-haiku-4-5
OPENAI_API_KEY=
OPENAI_MODEL=qwen3.6-max-preview
GEMINI_API_KEY=
GOOGLE_API_KEY=
GEMINI_MODEL=gemini-2.0-flash-exp
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=mistral:7b
```

生产环境不要把密钥放进客户端变量。Cloudflare Workers 部署时用 Wrangler secret 或 Cloudflare Dashboard 配置这些变量。

## 集成

- TanStack Start: `@tanstack/react-start` + Vite file routes。
- TanStack Router: `src/routes` file-based routing。
- TanStack Intent: 已安装本地 skill guidance，见 `AGENTS.md` 顶部 block。
- TanStack AI: `/api/chat` 使用 `chat()` 和 `toServerSentEventsResponse()`，首页通过 `useChat()` 连接。
- TanStack Store: `src/lib/gtr-dashboard-store.ts` 管理 V1 主题池、review session、pipeline run、偏好和 scoring weights；CLI demo 的 `workspace-store.ts` 仍保留给示例页。
- shadcn/ui: 已添加基础 UI 组件到 `src/components/ui`。
- Cloudflare: `@cloudflare/vite-plugin`、`wrangler.jsonc`、`npm run deploy`。
- CodeRabbit: `.coderabbit.yaml` 提供仓库评审指引；实际启用通过 GitHub App 安装完成，不作为运行时代码集成。

## 部署

```bash
npx wrangler whoami
npm run deploy
```

首次部署需要 `npx wrangler login` 或在 CI 中设置 `CLOUDFLARE_API_TOKEN`。如需 AI provider 密钥，使用 `npx wrangler secret put OPENAI_API_KEY` 等命令写入 Workers secrets。

## 下一步

- 接入真实 GitHub Trending 抓取和 Python scoring 输出。
- 把 artifact queue 从本地 UI 状态替换为服务端任务队列。
- 为 `/api/chat` 增加 tool calling，让 AI 能读取候选项目、写入反馈事件、排队生成任务。
- 安装 CodeRabbit GitHub App，并在首个 PR 中验证 review comments 是否符合 `.coderabbit.yaml` 指引。
