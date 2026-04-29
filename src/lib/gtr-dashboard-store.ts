import { Store } from '@tanstack/store'

import {
  createInitialDashboardState,
  pipelineStageNames,
} from '#/data/gtr-dashboard-fixtures'
import type {
  ChatMessage,
  DashboardState,
  PipelineRun,
  PipelineRunConfig,
  Preference,
  ReviewMessage,
  ReviewSignal,
  Topic,
  TopicAction,
  TopicContentUpdate,
  TopicPoolFilter,
  TopicReviewSession,
  TopicStats,
  Weight,
} from '#/lib/gtr-dashboard-types'
import type { TopicReviewWritebackResponse } from '#/lib/topic-review-writeback'

export const gtrDashboardStore = new Store<DashboardState>(
  createInitialDashboardState(),
)

export function resetGtrDashboardStore() {
  gtrDashboardStore.setState(() => createInitialDashboardState())
}

export function getTopicStats(): TopicStats {
  return gtrDashboardStore.state.topics.reduce<TopicStats>(
    (stats, topic) => {
      stats[topic.action] += 1
      stats.total += 1
      return stats
    },
    {
      pending: 0,
      approved: 0,
      published: 0,
      skipped: 0,
      total: 0,
    },
  )
}

export function getTodayTopics(limit = 8): Topic[] {
  return gtrDashboardStore.state.topics
    .filter((topic) => topic.action === 'pending' || topic.review_state === '对话中')
    .sort((left, right) => (right.final_score ?? 0) - (left.final_score ?? 0))
    .slice(0, limit)
}

export function getTopicPool(filter?: TopicPoolFilter): Topic[] {
  const topics = gtrDashboardStore.state.topics
    .slice()
    .sort((left, right) => (right.final_score ?? 0) - (left.final_score ?? 0))

  if (!filter) return topics

  return topics.filter((topic) => {
    if (filter === 'pending') {
      return topic.action === 'pending' && topic.review_state === '未聊'
    }
    if (filter === 'chatting') return topic.review_state === '对话中'
    if (filter === 'approved') return topic.action === 'approved'
    return topic.action === 'skipped'
  })
}

export function getTopicReviewSession(topicId: number): TopicReviewSession {
  const topic = getRequiredTopic(topicId)

  return {
    topic,
    messages: gtrDashboardStore.state.messages.filter(
      (message) => message.topic_id === topicId,
    ),
    signals: gtrDashboardStore.state.signals.filter(
      (signal) => signal.topic_id === topicId,
    ),
  }
}

export function selectTopic(topicId: number) {
  getRequiredTopic(topicId)
  gtrDashboardStore.setState((state) => ({
    ...state,
    selectedTopicId: topicId,
  }))
}

export function updateTopicAction(
  topicId: number,
  action: Exclude<TopicAction, 'pending' | 'published'>,
  notes?: string,
) {
  const topic = getRequiredTopic(topicId)
  const signalType =
    action === 'approved' ? 'adoption_reason' : 'rejection_reason'
  const label = notes?.trim() || (action === 'approved' ? '人工采纳' : '人工跳过')

  gtrDashboardStore.setState((state) => ({
    ...state,
    topics: state.topics.map((item) =>
      item.id === topicId
        ? {
            ...item,
            action,
            review_state: action === 'approved' ? '已采纳' : '已跳过',
            review_notes: notes?.trim() || item.review_notes,
          }
        : item,
    ),
    signals: [
      ...state.signals,
      {
        id: nextId(state.signals),
        topic_id: topicId,
        candidate_id: topic.candidate_id,
        message_id: null,
        signal_type: signalType,
        label,
        polarity: action === 'approved' ? 'positive' : 'negative',
        strength: 0.9,
        created_at: new Date().toISOString(),
      },
    ],
  }))
}

export function updateTopicContent(
  topicId: number,
  content: TopicContentUpdate,
) {
  getRequiredTopic(topicId)
  gtrDashboardStore.setState((state) => ({
    ...state,
    topics: state.topics.map((topic) =>
      topic.id === topicId ? { ...topic, ...content } : topic,
    ),
  }))
}

export function appendTopicReviewSignals(
  topicId: number,
  signals: TopicReviewWritebackResponse['signals'],
  messageId: number | null = null,
) {
  const topic = getRequiredTopic(topicId)
  if (signals.length === 0) return

  gtrDashboardStore.setState((state) => {
    const nextSignals: ReviewSignal[] = []

    for (const signal of signals) {
      const label = signal.label.trim()
      if (!label) continue
      const exists = [...state.signals, ...nextSignals].some(
        (item) =>
          item.topic_id === topicId &&
          item.signal_type === signal.signal_type &&
          item.label === label,
      )
      if (exists) continue

      nextSignals.push({
        id: nextId([...state.signals, ...nextSignals]),
        topic_id: topicId,
        candidate_id: topic.candidate_id,
        message_id: messageId,
        signal_type: signal.signal_type,
        label,
        polarity: signal.polarity,
        strength: clampSignalStrength(signal.strength),
        created_at: new Date().toISOString(),
      })
    }

    if (nextSignals.length === 0) return state

    return {
      ...state,
      signals: [...state.signals, ...nextSignals],
    }
  })
}

export function applyTopicReviewWriteback(
  topicId: number,
  writeback: TopicReviewWritebackResponse & { messageId?: number | null },
) {
  getRequiredTopic(topicId)
  appendTopicReviewSignals(topicId, writeback.signals, writeback.messageId ?? null)

  const draftUpdates: TopicContentUpdate = {}
  if (writeback.draftUpdates.tweet) {
    draftUpdates.user_edited_draft_tweet = writeback.draftUpdates.tweet
  }
  if (writeback.draftUpdates.script) {
    draftUpdates.user_edited_draft_script = writeback.draftUpdates.script
  }
  if (writeback.draftUpdates.outline) {
    draftUpdates.user_edited_draft_outline = writeback.draftUpdates.outline
  }

  if (Object.keys(draftUpdates).length > 0) {
    updateTopicContent(topicId, draftUpdates)
  }
}

export function appendTopicMessage(
  topicId: number,
  role: ChatMessage['role'],
  content: string,
): ReviewMessage {
  const topic = getRequiredTopic(topicId)
  const text = content.trim()
  if (!text) {
    throw new Error('Message content is required')
  }

  const created_at = new Date().toISOString()
  let message: ReviewMessage | undefined

  gtrDashboardStore.setState((state) => {
    message = {
      id: nextId(state.messages),
      topic_id: topicId,
      candidate_id: topic.candidate_id,
      role,
      content: text,
      created_at,
    }

    const signals = extractSignals(topic, message, state.signals)

    return {
      ...state,
      messages: [...state.messages, message],
      signals: [...state.signals, ...signals],
      topics: state.topics.map((item) =>
        item.id === topicId
          ? {
              ...item,
              review_state:
                item.review_state === '未聊' ? '对话中' : item.review_state,
              message_count: item.message_count + 1,
            }
          : item,
      ),
    }
  })

  return message as ReviewMessage
}

export function generateAssistantReply(topicId: number, userMessage: string) {
  const topic = getRequiredTopic(topicId)
  appendTopicMessage(topicId, 'user', userMessage)

  const reply = [
    `我会把 ${topic.project_name} 当作一个内容选题来评估。`,
    `核心角度可以是：${topic.differentiation_angle ?? '先找出和同类项目的差异点'}`,
    '建议先确认受众、冲突点和可视化素材，再决定是否采纳。',
  ].join('\n\n')

  appendTopicMessage(topicId, 'assistant', reply)
  return reply
}

export function triggerPipeline(config: PipelineRunConfig): PipelineRun {
  const runId =
    Math.max(0, ...gtrDashboardStore.state.pipelineRuns.map((run) => run.id)) + 1
  const startedAt = new Date().toISOString()
  const run: PipelineRun = {
    id: runId,
    status: 'running',
    projects_collected: Math.max(config.limit * 12, 24),
    projects_analyzed: Math.max(config.limit * 4, 8),
    topics_generated: config.limit,
    triggered_by: 'manual',
    started_at: startedAt,
    finished_at: null,
    error_log: null,
    config: {
      ...config,
      languages: [...config.languages],
    },
    stages: pipelineStageNames.map((stageName, index) => ({
      id: runId * 10 + index,
      stage_name: stageName,
      status: index === 0 ? 'running' : 'pending',
      progress: index === 0 ? 35 : 0,
      message:
        index === 0
          ? `Collecting ${config.limit} GitHub Trending candidates`
          : null,
      started_at: startedAt,
      finished_at: null,
    })),
  }

  gtrDashboardStore.setState((state) => ({
    ...state,
    activePipelineRunId: run.id,
    pipelineRuns: [run, ...state.pipelineRuns],
  }))

  return run
}

export function advancePipelineRun(runId: number) {
  const finishedAt = new Date().toISOString()

  gtrDashboardStore.setState((state) => ({
    ...state,
    pipelineRuns: state.pipelineRuns.map((run) =>
      run.id === runId
        ? {
            ...run,
            status: 'success',
            finished_at: finishedAt,
            stages: run.stages.map((stage) => ({
              ...stage,
              status: 'complete',
              progress: 100,
              finished_at: finishedAt,
              message: `${stage.stage_name} completed`,
            })),
          }
        : run,
    ),
  }))
}

export function getPipelineRun(runId: number | null): PipelineRun | null {
  if (!runId) return null
  return (
    gtrDashboardStore.state.pipelineRuns.find((run) => run.id === runId) ?? null
  )
}

export function getPipelineRuns(): PipelineRun[] {
  return [...gtrDashboardStore.state.pipelineRuns]
}

export function getPreferences(): Preference {
  return gtrDashboardStore.state.preferences
}

export function updatePreferences(preferences: Partial<Preference>) {
  gtrDashboardStore.setState((state) => ({
    ...state,
    preferences: {
      ...state.preferences,
      ...preferences,
      updated_at: new Date().toISOString(),
    },
  }))
}

export function getWeights(): Weight {
  return gtrDashboardStore.state.weights
}

export function updateWeights(weights: Partial<Weight>) {
  gtrDashboardStore.setState((state) => ({
    ...state,
    weights: {
      ...state.weights,
      ...weights,
      updated_at: new Date().toISOString(),
    },
  }))
}

function getRequiredTopic(topicId: number): Topic {
  const topic = gtrDashboardStore.state.topics.find((item) => item.id === topicId)
  if (!topic) {
    throw new Error(`Topic ${topicId} was not found`)
  }
  return topic
}

function nextId(items: Array<{ id: number }>) {
  return Math.max(0, ...items.map((item) => item.id)) + 1
}

function clampSignalStrength(strength: number) {
  if (!Number.isFinite(strength)) return 0.5
  return Math.max(0, Math.min(1, strength))
}

function extractSignals(
  topic: Topic,
  message: ReviewMessage,
  existingSignals: ReviewSignal[],
): ReviewSignal[] {
  const content = message.content
  const created_at = message.created_at
  const signals: ReviewSignal[] = []

  const addSignal = (
    label: string,
    signal_type: ReviewSignal['signal_type'],
    polarity: ReviewSignal['polarity'],
  ) => {
    if (
      existingSignals.some(
        (signal) => signal.topic_id === topic.id && signal.label === label,
      ) ||
      signals.some((signal) => signal.label === label)
    ) {
      return
    }
    signals.push({
      id: nextId([...existingSignals, ...signals]),
      topic_id: topic.id,
      candidate_id: topic.candidate_id,
      message_id: message.id,
      signal_type,
      label,
      polarity,
      strength: 0.74,
      created_at,
    })
  }

  if (content.includes('短视频') || content.toLowerCase().includes('video')) {
    addSignal('短视频', 'preference', 'positive')
  }
  if (content.includes('图文') || content.toLowerCase().includes('article')) {
    addSignal('图文', 'preference', 'positive')
  }
  if (content.includes('风险') || content.includes('担心')) {
    addSignal('风险说明', 'concern', 'negative')
  }
  if (content.includes('对比') || content.includes('差异')) {
    addSignal('差异化对比', 'requirement', 'neutral')
  }

  return signals
}
