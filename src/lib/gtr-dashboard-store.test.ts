import { beforeEach, describe, expect, it } from 'vitest'

import {
  appendTopicMessage,
  applyPipelineResult,
  applyTopicReviewWriteback,
  getPipelineRun,
  getPipelineRuns,
  getPreferences,
  getTodayTopics,
  getTopicPool,
  getTopicReviewSession,
  getTopicStats,
  getWeights,
  resetGtrDashboardStore,
  updatePreferences,
  updateTopicAction,
  updateTopicContent,
  updateWeights,
} from './gtr-dashboard-store'
import { createInitialDashboardState } from '#/data/gtr-dashboard-initial-state'
import type { PipelineArtifact } from './pipeline-result'

describe('gtrDashboardStore', () => {
  beforeEach(() => {
    resetGtrDashboardStore()
  })

  it('starts without preloaded topics, messages, signals, or pipeline runs', () => {
    expect(getTopicStats().total).toBe(0)
    expect(getPipelineRuns()).toHaveLength(0)
    expect(getTodayTopics()).toHaveLength(0)
    expect(getTopicPool()).toHaveLength(0)
  })

  it('creates initial timestamps at runtime', () => {
    const state = createInitialDashboardState()

    expect(state.preferences.updated_at).not.toBe('2026-04-26T09:00:00.000Z')
    expect(state.weights.updated_at).toBe(state.preferences.updated_at)
  })

  it('updates topic stats and review state when approving or skipping topics', () => {
    applySamplePipelineResult(2)
    const [firstTopic, secondTopic] = getTodayTopics(2)
    const initialStats = getTopicStats()

    updateTopicAction(firstTopic.id, 'approved', '适合做首发深度选题')
    updateTopicAction(secondTopic.id, 'skipped', '暂时没有明确内容钩子')

    const stats = getTopicStats()
    const approvedSession = getTopicReviewSession(firstTopic.id)
    const skippedSession = getTopicReviewSession(secondTopic.id)

    expect(stats.pending).toBe(initialStats.pending - 2)
    expect(stats.approved).toBe(initialStats.approved + 1)
    expect(stats.skipped).toBe(initialStats.skipped + 1)
    expect(approvedSession.topic.review_state).toBe('已采纳')
    expect(skippedSession.topic.review_state).toBe('已跳过')
    expect(approvedSession.topic.review_notes).toContain('首发深度选题')
    expect(skippedSession.signals.at(-1)?.signal_type).toBe('rejection_reason')
  })

  it('keeps review sessions conversational and stores refined content', () => {
    applySamplePipelineResult(1)
    const [topic] = getTodayTopics(1)

    appendTopicMessage(topic.id, 'user', '这个项目适合做短视频吗？')
    appendTopicMessage(topic.id, 'assistant', '适合，建议突出使用前后对比。')
    updateTopicContent(topic.id, {
      draft_script: '开场：展示开发者配置失败，再切入项目解决方案。',
    })

    const session = getTopicReviewSession(topic.id)

    expect(session.messages).toHaveLength(2)
    expect(session.topic.review_state).toBe('对话中')
    expect(session.topic.message_count).toBe(2)
    expect(session.topic.draft_script).toContain('开发者配置失败')
    expect(session.signals.some((signal) => signal.label === '短视频')).toBe(true)
  })

  it('applies AI writeback signals and draft updates without replacing omitted drafts', () => {
    applySamplePipelineResult(1)
    const [topic] = getTodayTopics(1)

    appendTopicMessage(topic.id, 'user', '帮我改成更适合短视频的脚本。')
    const assistantMessage = appendTopicMessage(
      topic.id,
      'assistant',
      '可以从部署前后的对比切入，并强化开场钩子。',
    )
    const previousSession = getTopicReviewSession(topic.id)
    const previousTweet = previousSession.topic.draft_tweet

    applyTopicReviewWriteback(topic.id, {
      messageId: assistantMessage.id,
      signals: [
        {
          signal_type: 'preference',
          label: '部署前后对比',
          polarity: 'positive',
          strength: 0.82,
        },
      ],
      draftUpdates: {
        script: '开场：先展示部署失败，再切入这个项目如何缩短验证路径。',
      },
    })

    const session = getTopicReviewSession(topic.id)

    expect(session.signals.at(-1)).toMatchObject({
      signal_type: 'preference',
      label: '部署前后对比',
      polarity: 'positive',
      strength: 0.82,
      message_id: assistantMessage.id,
    })
    expect(session.topic.user_edited_draft_script).toContain('部署失败')
    expect(session.topic.user_edited_draft_tweet).toBeNull()
    expect(session.topic.draft_tweet).toBe(previousTweet)
    expect(session.topic.review_state).toBe('对话中')
    expect(session.topic.message_count).toBe(previousSession.topic.message_count)
  })

  it('filters the topic pool by review state and action', () => {
    applySamplePipelineResult(1)
    const [firstTopic] = getTodayTopics(1)

    updateTopicAction(firstTopic.id, 'approved', '作为本周主推')

    expect(getTopicPool('approved').map((topic) => topic.id)).toContain(
      firstTopic.id,
    )
    expect(getTopicPool('pending').map((topic) => topic.id)).not.toContain(
      firstTopic.id,
    )
    expect(getTopicPool()).toHaveLength(getTopicStats().total)
  })

  it('applies Python pipeline results to runs and topic candidates', () => {
    const previousTotal = getTopicStats().total
    const run = applySamplePipelineResult(1)

    expect(run.status).toBe('success')
    expect(getPipelineRuns()[0].id).toBe(run.id)
    expect(getPipelineRun(run.id)?.id).toBe(run.id)
    expect(getTopicStats().total).toBe(previousTotal + 1)
    expect(getTodayTopics(1)[0]).toMatchObject({
      project_name: 'owner/agent-tool',
      github_url: 'https://github.com/owner/agent-tool',
      review_state: '未聊',
      action: 'pending',
    })
  })

  it('updates preferences and scoring weights without replacing omitted fields', () => {
    const previousPreferences = getPreferences()
    const previousWeights = getWeights()

    updatePreferences({
      positioning: '面向中文开发者的 AI 工具选题',
      min_stars_threshold: 500,
    })
    updateWeights({
      novelty_weight: 0.34,
      engagement_weight: 0.22,
    })

    expect(getPreferences()).toMatchObject({
      positioning: '面向中文开发者的 AI 工具选题',
      min_stars_threshold: 500,
      preferred_languages: previousPreferences.preferred_languages,
    })
    expect(getWeights()).toMatchObject({
      novelty_weight: 0.34,
      engagement_weight: 0.22,
      utility_weight: previousWeights.utility_weight,
    })
  })
})

function applySamplePipelineResult(topicCount: number) {
  return applyPipelineResult(createSampleArtifact(topicCount), {
    languages: ['python'],
    limit: topicCount,
    top_n: topicCount,
    source: 'legacy',
    model: 'local-heuristic',
  })
}

function createSampleArtifact(topicCount: number): PipelineArtifact {
  return {
    status: 'success',
    projects_collected: topicCount,
    projects_analyzed: topicCount,
    topics_generated: topicCount,
    report_path: 'reports/daily_report_2026-04-29.md',
    error_log: null,
    started_at: '2026-04-29T08:00:00.000Z',
    finished_at: '2026-04-29T08:00:01.000Z',
    stages: ['collect', 'profile', 'strategize', 'curate', 'report'].map(
      (name) => ({
        name: name as PipelineArtifact['stages'][number]['name'],
        status: 'complete',
        progress: 100,
        message: `${name} complete`,
        started_at: '2026-04-29T08:00:00.000Z',
        finished_at: '2026-04-29T08:00:01.000Z',
      }),
    ),
    topics: Array.from({ length: topicCount }, (_, index) => ({
      rank: index + 1,
      final_score: 9.9 - index,
      selection_reason: '契合本地 AI 和 agent 选题定位',
      project_name:
        index === 0 ? 'owner/agent-tool' : `owner/agent-tool-${index + 1}`,
      github_url:
        index === 0
          ? 'https://github.com/owner/agent-tool'
          : `https://github.com/owner/agent-tool-${index + 1}`,
      language: 'Python',
      stars: 12345 - index,
      why_post: '值得做选题',
      differentiation_angle: '聚焦真实工作流',
      target_audience: '开发者',
      engagement_estimate: 'high',
      draft_tweet: 'tweet',
      draft_script: 'script',
      draft_outline: 'outline',
      tags: ['Python', 'AI'],
      generation_status: 'complete',
    })),
  }
}
