<!-- intent-skills:start -->
## Skill Loading

Before substantial work:
- Skill check: run `npx @tanstack/intent@latest list`, or use skills already listed in context.
- Skill guidance: if one local skill clearly matches the task, run `npx @tanstack/intent@latest load <package>#<skill>` and follow the returned `SKILL.md`.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.
<!-- intent-skills:end -->

## Git 工作流

- 永远不要直接 push 到 main。提交意图用于 PR 的改动前，先创建 feature 分支（feat/...、fix/...、chore/...）。
- 当用户说“commit and push”时，如果当前在 main 分支，先确认目标分支。
- Git commit 信息遵守 Conventional Commits 规范。

## 语言要求

- 交流过程中请使用中文。
- 文档使用中文撰写，并优先存放在 `docs/` 目录下。
- 代码注释使用英文，优先说明 why，其次 what，尽量少写 how。

## 技术栈与脚手架来源

- 项目用 TanStack CLI 创建，原始命令：

```bash
npx @tanstack/cli@latest create my-tanstack-app --agent --deployment cloudflare --add-ons ai,shadcn,store
```

- CLI 后续 TanStack Intent 命令：

```bash
npx @tanstack/intent@latest install
npx @tanstack/intent@latest list
```

- 选择栈：React、TanStack Start、TanStack Router、TanStack AI、TanStack Store、shadcn/ui、Cloudflare Workers。
- 保持 CLI 默认工具链；当前 package manager 为 npm。
- 项目结构尽量保留 TanStack CLI 的 file routes、`src/components`、`src/lib`、`src/routes/demo` 和 Cloudflare 配置。

## 产品架构

- GTR-Board 是 chat-first AI workspace，用来发现和评估 GitHub Trending 项目作为内容选题。
- TanStack Start 负责交互产品层。
- Python services 负责夜间 topic discovery、research、scoring 和长时间 artifact generation。
- 当前 `/api/chat` 使用 TanStack AI server route；provider keys 只允许服务端读取。
- V1 使用 `src/lib/gtr-dashboard-store.ts` 和 `src/data/gtr-dashboard-fixtures.ts` 模拟旧项目的主题池、review session、pipeline run、preferences 和 scoring weights。
- V1 路由为 `/`、`/topics`、`/pipeline`、`/settings`；历史趋势图路由已明确删除，不新增 `/history`。

## 集成要求

- Cloudflare：保留 `@cloudflare/vite-plugin`、`wrangler.jsonc` 和 `npm run deploy`；部署前运行 `npx wrangler whoami`。
- CodeRabbit：不要添加运行时代码或 SDK。CodeRabbit 通过 GitHub App 安装到仓库，`.coderabbit.yaml` 只保存 PR review 指引。
- shadcn/ui：新增组件前先运行 `npx shadcn@latest info --json`，需要组件 API 时运行 `npx shadcn@latest docs <component>`。

## 环境变量

- 本地参考 `.env.example`，复制到 `.env.local`。
- Cloudflare 生产环境用 `wrangler secret put` 或 Dashboard 配置 provider keys。
- 支持变量：`ANTHROPIC_API_KEY`、`ANTHROPIC_MODEL`、`OPENAI_API_KEY`、`OPENAI_MODEL`、`GEMINI_API_KEY`、`GOOGLE_API_KEY`、`GEMINI_MODEL`、`OLLAMA_HOST`、`OLLAMA_MODEL`。

## 已知 gotchas

- TanStack Start loader 是 isomorphic；数据库、密钥、文件系统和外部私有 API 调用必须放进 server route 或 `createServerFn`。
- TanStack AI 不是 Vercel AI SDK；使用 `chat()`、`openaiText()`、`toServerSentEventsResponse()` 和 `@tanstack/ai-react`。
- 当前候选项目、pipeline run、偏好和权重都是 seed data，真实 GitHub Trending/Python scoring 接入仍是下一步。
- 旧项目 `BubblePtr/GTR-Dashboard` 的 Python FastAPI/SQLModel/pipeline 实现没有迁入；当前只迁移前端产品形态和本地交互模型。
- TanStack CLI 进度 UI 可能在依赖安装阶段卡住；生成文件可保留，之后直接运行 `npm install`。

## 工程要求

- 像高水平资深工程师一样工作，保持简洁、直接，并专注执行。
- 优先选择简单、可维护、生产友好的方案；代码应低复杂度，易读、易调试、易修改。
- 不要为了小功能过度设计，不要引入沉重抽象、额外层级或大型依赖。
- 保持 API 小而明确，行为显式，命名清晰。除非能明显改善结果，否则避免 cleverness。
