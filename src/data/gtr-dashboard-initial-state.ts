import type {
  DashboardState,
  PipelineStageName,
  Preference,
  Weight,
} from '#/lib/gtr-dashboard-types'

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
  updated_at: '',
}

export const defaultWeights: Weight = {
  id: 1,
  novelty_weight: 0.28,
  utility_weight: 0.26,
  local_ai_weight: 0.18,
  doc_quality_weight: 0.12,
  engagement_weight: 0.16,
  updated_at: '',
}

export function createInitialDashboardState(): DashboardState {
  const now = new Date().toISOString()

  return {
    topics: [],
    messages: [],
    signals: [],
    pipelineRuns: [],
    activePipelineRunId: null,
    preferences: { ...defaultPreferences, updated_at: now },
    weights: { ...defaultWeights, updated_at: now },
    selectedTopicId: null,
    candidateView: 'today',
    poolFilter: undefined,
  }
}
