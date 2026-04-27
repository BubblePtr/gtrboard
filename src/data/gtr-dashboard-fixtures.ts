import type {
  DashboardState,
  PipelineRun,
  PipelineStageName,
  Preference,
  ReviewMessage,
  ReviewSignal,
  Topic,
  Weight,
} from '#/lib/gtr-dashboard-types'

const now = '2026-04-26T09:00:00.000Z'

export const pipelineStageNames: PipelineStageName[] = [
  'collect',
  'profile',
  'strategize',
  'curate',
  'report',
]

export const seedTopics: Topic[] = [
  {
    id: 101,
    candidate_id: 9001,
    profile_id: 7001,
    project_name: 'llama.cpp server templates',
    github_url: 'https://github.com/ggerganov/llama.cpp',
    language: 'C++',
    stars: 82700,
    forks: 11800,
    why_post:
      '本地模型部署门槛继续下降，适合讲清普通开发者如何从 demo 走到可复用服务。',
    differentiation_angle:
      '避开“又一个本地 LLM 教程”，聚焦服务化模板、延迟控制和真实部署坑。',
    target_audience: '想把本地模型接进生产工具链的独立开发者和技术创作者',
    engagement_estimate: '高互动',
    draft_tweet:
      '本地 LLM 不缺 demo，缺的是能被团队复用的服务模板。今天拆一个 GitHub Trending 项目，看看它如何把模型、路由和推理参数变成可维护接口。',
    draft_script:
      '开场：展示本地模型 demo 到服务化之间的断层。中段：拆解模板结构、延迟指标和部署参数。结尾：给出适合团队试点的检查清单。',
    draft_outline:
      '1. Trending 背景\n2. 为什么不是普通教程\n3. 三个可复用设计\n4. 风险与适用边界',
    user_edited_draft_tweet: null,
    user_edited_draft_script: null,
    user_edited_draft_outline: null,
    review_notes: null,
    priority_score: 91,
    final_score: 88.4,
    generation_status: 'generated',
    created_at: now,
    action: 'pending',
    review_state: '未聊',
    message_count: 0,
    first_seen_at: now,
    last_seen_at: now,
    seen_count: 3,
    latest_topic_id: null,
    tags: ['Local AI', 'Inference', 'C++'],
  },
  {
    id: 102,
    candidate_id: 9002,
    profile_id: 7002,
    project_name: 'OpenDevin workflow runner',
    github_url: 'https://github.com/OpenDevin/OpenDevin',
    language: 'Python',
    stars: 41200,
    forks: 4600,
    why_post:
      'AI coding agent 从聊天走向任务执行，适合做“工作流怎么设计才可控”的内容。',
    differentiation_angle:
      '不用泛讲智能体，改从权限边界、任务恢复和审计日志讲产品设计。',
    target_audience: '关注 AI coding workflow 的工程负责人和工具开发者',
    engagement_estimate: '强讨论',
    draft_tweet:
      'AI coding agent 真正难的不是会写代码，而是能不能安全地接手一个完整任务。这个 Trending 项目值得从 workflow runner 角度拆。',
    draft_script:
      '开场：一次失败的自动修复任务。中段：工作区、权限、恢复点。结尾：给团队落地 agent 的三条边界。',
    draft_outline:
      '1. Agent 热度变化\n2. Runner 的工程边界\n3. Human-in-loop 设计\n4. 内容角度建议',
    user_edited_draft_tweet: null,
    user_edited_draft_script: null,
    user_edited_draft_outline: null,
    review_notes: null,
    priority_score: 86,
    final_score: 84.1,
    generation_status: 'generated',
    created_at: now,
    action: 'pending',
    review_state: '未聊',
    message_count: 0,
    first_seen_at: now,
    last_seen_at: now,
    seen_count: 2,
    latest_topic_id: null,
    tags: ['Agent', 'Workflow', 'Python'],
  },
  {
    id: 103,
    candidate_id: 9003,
    profile_id: 7003,
    project_name: 'pgvector dashboard kit',
    github_url: 'https://github.com/pgvector/pgvector',
    language: 'TypeScript',
    stars: 17100,
    forks: 820,
    why_post:
      '向量数据库内容已经拥挤，但 dashboard 化的可观测性角度仍然有内容价值。',
    differentiation_angle:
      '从“怎么存向量”转为“怎么发现召回质量退化”，适合做图文拆解。',
    target_audience: '做 RAG 应用和内部知识库的工程师',
    engagement_estimate: '中高互动',
    draft_tweet:
      'RAG 项目上线后，真正麻烦的是你不知道召回何时变差。今天这个方向适合从可观测性讲 pgvector。',
    draft_script:
      '开场：一次回答质量下降但没人发现。中段：召回样本、索引、embedding 版本。结尾：仪表盘 checklist。',
    draft_outline: '1. RAG 痛点\n2. 为什么需要 dashboard\n3. 指标设计\n4. 适合谁用',
    user_edited_draft_tweet: null,
    user_edited_draft_script: null,
    user_edited_draft_outline: null,
    review_notes: null,
    priority_score: 78,
    final_score: 79.6,
    generation_status: 'generated',
    created_at: now,
    action: 'pending',
    review_state: '对话中',
    message_count: 2,
    first_seen_at: now,
    last_seen_at: now,
    seen_count: 1,
    latest_topic_id: null,
    tags: ['RAG', 'Postgres', 'Observability'],
  },
  {
    id: 104,
    candidate_id: 9004,
    profile_id: 7004,
    project_name: 'browser-use cookbook',
    github_url: 'https://github.com/browser-use/browser-use',
    language: 'Python',
    stars: 18700,
    forks: 2100,
    why_post:
      '浏览器自动化 agent 正在从 demo 转向可复用 cookbook，适合对比 Playwright 和 agent 流程。',
    differentiation_angle:
      '重点讲“什么时候该用确定性脚本，什么时候才用 agent”，有实用辨识度。',
    target_audience: '做增长自动化、数据采集和内部运营工具的开发者',
    engagement_estimate: '高收藏',
    draft_tweet:
      '浏览器 agent 很酷，但不是所有自动化都该交给 AI。这个 cookbook 值得用来讲“确定性脚本 vs agent”的边界。',
    draft_script:
      '开场：同一个网页任务的两种做法。中段：脚本、agent、失败恢复。结尾：选择矩阵。',
    draft_outline: '1. 任务分类\n2. agent 优势\n3. 可控性风险\n4. 实战建议',
    user_edited_draft_tweet: null,
    user_edited_draft_script: null,
    user_edited_draft_outline: null,
    review_notes: null,
    priority_score: 82,
    final_score: 81.2,
    generation_status: 'generated',
    created_at: now,
    action: 'approved',
    review_state: '已采纳',
    message_count: 4,
    first_seen_at: now,
    last_seen_at: now,
    seen_count: 4,
    latest_topic_id: null,
    tags: ['Browser Agent', 'Automation', 'Python'],
  },
  {
    id: 105,
    candidate_id: 9005,
    profile_id: 7005,
    project_name: 'tinygrad visualizer',
    github_url: 'https://github.com/tinygrad/tinygrad',
    language: 'Python',
    stars: 31200,
    forks: 3600,
    why_post:
      '可视化深度学习运行过程有传播性，但当前项目与目标受众距离略远。',
    differentiation_angle:
      '如果做，需要把技术深度转换成“理解模型执行”的入门故事。',
    target_audience: '对 ML 系统底层感兴趣的技术读者',
    engagement_estimate: '小众深度',
    draft_tweet:
      '如果你想知道神经网络代码真正执行了什么，可视化工具比公式更适合作为入口。',
    draft_script:
      '开场：黑盒训练过程。中段：图、算子、性能瓶颈。结尾：适合进阶读者。',
    draft_outline: '1. 项目背景\n2. 可视化价值\n3. 内容难点\n4. 是否值得做',
    user_edited_draft_tweet: null,
    user_edited_draft_script: null,
    user_edited_draft_outline: null,
    review_notes: '目标人群偏窄，先跳过。',
    priority_score: 62,
    final_score: 64.5,
    generation_status: 'generated',
    created_at: now,
    action: 'skipped',
    review_state: '已跳过',
    message_count: 1,
    first_seen_at: now,
    last_seen_at: now,
    seen_count: 1,
    latest_topic_id: null,
    tags: ['ML Systems', 'Visualization', 'Python'],
  },
]

export const seedMessages: ReviewMessage[] = [
  {
    id: 1,
    topic_id: 103,
    candidate_id: 9003,
    role: 'user',
    content: '这个方向会不会太像普通 RAG 文章？',
    created_at: now,
  },
  {
    id: 2,
    topic_id: 103,
    candidate_id: 9003,
    role: 'assistant',
    content:
      '建议避开入门教程，改讲召回质量监控。这个角度更接近项目上线后的真实问题。',
    created_at: now,
  },
]

export const seedSignals: ReviewSignal[] = [
  {
    id: 1,
    topic_id: 103,
    candidate_id: 9003,
    message_id: 2,
    signal_type: 'preference',
    label: '上线后问题',
    polarity: 'positive',
    strength: 0.82,
    created_at: now,
  },
  {
    id: 2,
    topic_id: 105,
    candidate_id: 9005,
    message_id: null,
    signal_type: 'rejection_reason',
    label: '受众偏窄',
    polarity: 'negative',
    strength: 0.66,
    created_at: now,
  },
]

export const seedPipelineRuns: PipelineRun[] = [
  {
    id: 301,
    status: 'success',
    projects_collected: 128,
    projects_analyzed: 42,
    topics_generated: 8,
    triggered_by: 'nightly',
    started_at: '2026-04-26T01:00:00.000Z',
    finished_at: '2026-04-26T01:18:00.000Z',
    error_log: null,
    config: {
      languages: [''],
      limit: 8,
      source: 'legacy',
      model: 'qwen3.6-max-preview',
    },
    stages: pipelineStageNames.map((stageName, index) => ({
      id: 3010 + index,
      stage_name: stageName,
      status: 'complete',
      progress: 100,
      message: `${stageName} completed`,
      started_at: '2026-04-26T01:00:00.000Z',
      finished_at: '2026-04-26T01:18:00.000Z',
    })),
  },
  {
    id: 300,
    status: 'partial_failure',
    projects_collected: 96,
    projects_analyzed: 31,
    topics_generated: 5,
    triggered_by: 'nightly',
    started_at: '2026-04-25T01:00:00.000Z',
    finished_at: '2026-04-25T01:22:00.000Z',
    error_log: 'report stage retried once because media summary timed out.',
    config: {
      languages: ['typescript', 'python'],
      limit: 10,
      source: 'both',
      model: 'qwen3.6-max-preview',
    },
    stages: pipelineStageNames.map((stageName, index) => ({
      id: 3000 + index,
      stage_name: stageName,
      status: stageName === 'report' ? 'failed' : 'complete',
      progress: stageName === 'report' ? 70 : 100,
      message:
        stageName === 'report'
          ? 'media summary timed out'
          : `${stageName} completed`,
      started_at: '2026-04-25T01:00:00.000Z',
      finished_at: stageName === 'report' ? null : '2026-04-25T01:22:00.000Z',
    })),
  },
]

export const seedPreferences: Preference = {
  id: 1,
  positioning: '面向中文开发者，优先解释 AI 工具的真实可用性',
  preferred_languages: 'typescript, python, rust',
  min_stars_threshold: 300,
  local_ai_weight: 0.35,
  daily_run_time: '09:00',
  auto_publish: false,
  updated_at: now,
}

export const seedWeights: Weight = {
  id: 1,
  novelty_weight: 0.28,
  utility_weight: 0.26,
  local_ai_weight: 0.18,
  doc_quality_weight: 0.12,
  engagement_weight: 0.16,
  updated_at: now,
}

export function createInitialDashboardState(): DashboardState {
  return {
    topics: seedTopics.map((topic) => ({ ...topic, tags: [...topic.tags] })),
    messages: seedMessages.map((message) => ({ ...message })),
    signals: seedSignals.map((signal) => ({ ...signal })),
    pipelineRuns: seedPipelineRuns.map((run) => ({
      ...run,
      config: { ...run.config, languages: [...run.config.languages] },
      stages: run.stages.map((stage) => ({ ...stage })),
    })),
    activePipelineRunId: seedPipelineRuns[0]?.id ?? null,
    preferences: { ...seedPreferences },
    weights: { ...seedWeights },
    selectedTopicId: seedTopics[0].id,
    candidateView: 'today',
    poolFilter: undefined,
  }
}
