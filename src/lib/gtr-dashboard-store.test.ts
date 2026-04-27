import { beforeEach, describe, expect, it } from 'vitest'

import {
  appendTopicMessage,
  getPipelineRun,
  getPipelineRuns,
  getPreferences,
  getTodayTopics,
  getTopicPool,
  getTopicReviewSession,
  getTopicStats,
  getWeights,
  resetGtrDashboardStore,
  triggerPipeline,
  updatePreferences,
  updateTopicAction,
  updateTopicContent,
  updateWeights,
} from './gtr-dashboard-store'

describe('gtrDashboardStore', () => {
  beforeEach(() => {
    resetGtrDashboardStore()
  })

  it('updates topic stats and review state when approving or skipping topics', () => {
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

  it('filters the topic pool by review state and action', () => {
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

  it('starts a simulated pipeline run with the expected stages', () => {
    const run = triggerPipeline({
      languages: ['typescript', 'python'],
      limit: 8,
      source: 'legacy',
      model: 'qwen3.6-max-preview',
    })

    expect(run.status).toBe('running')
    expect(run.triggered_by).toBe('manual')
    expect(run.stages.map((stage) => stage.stage_name)).toEqual([
      'collect',
      'profile',
      'strategize',
      'curate',
      'report',
    ])
    expect(getPipelineRun(run.id)?.id).toBe(run.id)
    expect(getPipelineRuns()[0].id).toBe(run.id)
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
