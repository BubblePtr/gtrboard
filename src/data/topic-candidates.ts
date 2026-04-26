export type TopicCandidate = {
  id: string
  name: string
  repo: string
  category: string
  trendScore: number
  contentFit: number
  momentum: string
  language: string
  stars: string
  summary: string
  angle: string
  risks: Array<string>
  signals: Array<string>
}

export const topicCandidates: Array<TopicCandidate> = [
  {
    id: 'react-scan',
    name: 'react-scan',
    repo: 'aidenybai/react-scan',
    category: 'Frontend Performance',
    trendScore: 94,
    contentFit: 91,
    momentum: '+2.8k stars / 7d',
    language: 'TypeScript',
    stars: '23.4k',
    summary:
      '自动检测 React 应用中的性能问题，把渲染热点直接可视化到页面上。',
    angle:
      '适合做“React 性能调优从猜测到可视化诊断”的教程型内容。',
    risks: ['同类工具较多，需要突出差异', '读者可能期待真实项目 benchmark'],
    signals: ['开发者痛点明确', 'Demo 容易截图', '可延展到性能优化清单'],
  },
  {
    id: 'open-lovable',
    name: 'open-lovable',
    repo: 'firecrawl/open-lovable',
    category: 'AI App Builder',
    trendScore: 89,
    contentFit: 87,
    momentum: '+1.9k stars / 7d',
    language: 'TypeScript',
    stars: '18.1k',
    summary:
      '开源 AI 应用生成器，把自然语言、浏览器上下文和代码生成结合起来。',
    angle:
      '适合比较“AI 生成应用的开源实现路径，以及它和闭源产品的边界”。',
    risks: ['实现链路复杂', '需要避免只复述 README'],
    signals: ['AI 原生主题强', '容易做架构拆解', '适合视频脚本'],
  },
  {
    id: 'supermemory',
    name: 'supermemory',
    repo: 'supermemoryai/supermemory',
    category: 'Personal Knowledge',
    trendScore: 84,
    contentFit: 82,
    momentum: '+1.2k stars / 7d',
    language: 'TypeScript',
    stars: '11.6k',
    summary:
      '面向个人知识和 AI 记忆的开源工作区，围绕抓取、检索和上下文复用展开。',
    angle:
      '适合做“个人 AI 记忆系统到底需要哪些基础设施”的分析内容。',
    risks: ['产品边界容易发散', '需要验证部署和数据权限模型'],
    signals: ['长期价值明显', '适合图解架构', '可与 RAG/agent 主题联动'],
  },
  {
    id: 'suna',
    name: 'suna',
    repo: 'kortix-ai/suna',
    category: 'Agent Runtime',
    trendScore: 79,
    contentFit: 76,
    momentum: '+820 stars / 7d',
    language: 'Python',
    stars: '9.8k',
    summary:
      '通用 AI agent 平台，强调浏览器自动化、工具调用和长任务执行。',
    angle:
      '适合做“一个完整 agent 产品需要哪些运行时能力”的深度拆解。',
    risks: ['需要实测才能判断可靠性', '长任务 demo 成本较高'],
    signals: ['工程内容密度高', '适合对比框架', '可沉淀评测模板'],
  },
]

export const artifactIdeas = [
  '项目热度雷达图',
  '三段式短视频脚本',
  '封面图提示词',
  '竞品对比表',
]
