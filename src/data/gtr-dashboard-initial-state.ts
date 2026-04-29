import type {
  DashboardState,
  PipelineStageName,
  Preference,
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

export const defaultPreferences: Preference = {
  id: 1,
  positioning: '面向中文开发者，优先解释 AI 工具的真实可用性',
  preferred_languages: 'typescript, python, rust',
  min_stars_threshold: 300,
  local_ai_weight: 0.35,
  daily_run_time: '09:00',
  auto_publish: false,
  updated_at: now,
}

export const defaultWeights: Weight = {
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
    topics: [],
    messages: [],
    signals: [],
    pipelineRuns: [],
    activePipelineRunId: null,
    preferences: { ...defaultPreferences },
    weights: { ...defaultWeights },
    selectedTopicId: null,
    candidateView: 'today',
    poolFilter: undefined,
  }
}
