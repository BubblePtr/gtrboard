# GTR-Board 项目上下文

## 架构决策

- TanStack Start 负责交互产品层：路由、SSR、聊天 UI、人工反馈和 artifact 规划。
- Python services 负责后台：夜间 GitHub Trending 发现、项目研究、评分、长时间媒体生成和反馈再训练。
- AI provider 密钥只在服务端使用，当前 `/api/chat` 通过 TanStack Start server route 暴露 SSE。
- Cloudflare Workers 是当前部署目标；配置保留在 `wrangler.jsonc` 和 `vite.config.ts`。
- CodeRabbit 不进入运行时代码。它应通过 GitHub App 安装到仓库，并读取 `.coderabbit.yaml` 作为 PR review 指引。
- V1 迁移旧项目 `BubblePtr/GTR-Dashboard` 的前端产品形态：Dashboard、选题管理、Pipeline 和设置页。旧后端实现未迁入。
- V1 本地服务函数集中在 `src/lib/gtr-dashboard-store.ts`，seed data 在 `src/data/gtr-dashboard-fixtures.ts`。
- 历史趋势图路由已删除，不新增 `/history`。

## 环境变量

见仓库根目录 `.env.example`。本地可复制到 `.env.local`，生产环境用 Cloudflare Workers secrets。

## 已知事项

- TanStack CLI 生成命令必须保留在 `AGENTS.md` 和 README 中，方便后续代理知道项目来源。
- TanStack Intent 安装后会写入 `AGENTS.md` 顶部 skill loading block；后续大改前应先运行 `npx @tanstack/intent@latest list`。
- 当前候选项目、pipeline run、偏好和权重都是本地 seed data，真实流水线输出尚未接入。
