# GTR-Board 项目上下文

## 架构决策

- TanStack Start 负责交互产品层：路由、SSR、聊天 UI、人工反馈和 artifact 规划。
- Python services 负责后台：夜间 GitHub Trending 发现、项目研究、评分、长时间媒体生成和反馈再训练。
- AI provider 密钥只在服务端使用，当前 `/api/chat` 通过 TanStack Start server route 暴露 SSE。
- Cloudflare Workers 是当前部署目标；配置保留在 `wrangler.jsonc` 和 `vite.config.ts`。
- CodeRabbit 不进入运行时代码。它应通过 GitHub App 安装到仓库，并读取 `.coderabbit.yaml` 作为 PR review 指引。
- V1 迁移旧项目 `BubblePtr/GTR-Dashboard` 的前端产品形态：Dashboard、选题管理、Pipeline 和设置页。旧后端实现未迁入。
- V1 本地服务函数集中在 `src/lib/gtr-dashboard-store.ts`；初始主题、消息、信号和 pipeline run 为空，由用户从 UI 触发 pipeline 后写入。
- 历史趋势图路由已删除，不新增 `/history`。

## 环境变量

见仓库根目录 `.env.example`。本地可复制到 `.env.local`，生产环境用 Cloudflare Workers secrets。

## 已知事项

- TanStack CLI 生成命令必须保留在 `AGENTS.md` 和 README 中，方便后续代理知道项目来源。
- TanStack Intent 安装后会写入 `AGENTS.md` 顶部 skill loading block；后续大改前应先运行 `npx @tanstack/intent@latest list`。
- 当前前端候选项目、pipeline run、偏好和权重以本地 store 为准；本地 dev 模式下，`/pipeline` 和 `/topics` 会通过 API route 直接触发 Python pipeline，并把结果写入本地 store。

## Python Pipeline

当前 Python service 位于 `services/pipeline`，参考旧项目 `BubblePtr/GTR-Dashboard` 的五阶段结构：

1. `collect`：从 GitHub Trending 收集项目；测试中另有离线数据源用于自动化验证。
2. `profile`：优先用 OpenAI-compatible LLM 评分生成项目画像；无 key 或调用失败时降级到启发式评分。
3. `strategize`：生成选题理由、差异化角度和草稿。
4. `curate`：按 novelty、utility、local AI、doc quality、engagement 权重排序。
5. `report`：输出 Markdown 报告和 `latest_pipeline_run.json`。

常用命令：

```bash
npm run pipeline:run -- --limit 5 --top-n 3
npm run pipeline:run -- --lang python --limit 10
npm run pipeline:test
```

`npm run pipeline:run` 默认输出到 `public/pipeline-results/`，用于命令行验证和调试。该目录为本地生成物，不提交到仓库。

默认 `npm run dev` 使用本地 Node SSR，便于 API route 调用 Python。Cloudflare runtime 仅在 `npm run deploy` 时通过 `GTR_DEPLOY_TARGET=cloudflare` 启用。

LLM 评分和选题生成读取 `OPENAI_API_KEY`、`OPENAI_BASE_URL` 和 `OPENAI_MODEL`。`OPENAI_BASE_URL` 可指向 OpenAI-compatible provider；MVP 默认模型为 `qwen3.6-max-preview`。本地 CLI 会读取 `.env.local`；`.env.loacl` 仅作为早期本地配置 typo 的兼容入口保留，后续应统一迁移到 `.env.local`。
