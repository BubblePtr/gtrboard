export type TopicAction = 'pending' | 'approved' | 'published' | 'skipped'

export type ReviewState = '未聊' | '对话中' | '已采纳' | '已跳过'

export type CandidateView = 'today' | 'pool'

export type TopicPoolFilter = 'pending' | 'chatting' | 'approved' | 'skipped'

export type ReviewSignalType =
  | 'preference'
  | 'concern'
  | 'requirement'
  | 'adoption_reason'
  | 'rejection_reason'

export interface Topic {
  id: number
  candidate_id: number | null
  profile_id: number | null
  project_name: string | null
  github_url: string | null
  language: string
  stars: number
  forks: number
  why_post: string | null
  differentiation_angle: string | null
  target_audience: string | null
  engagement_estimate: string
  draft_tweet: string | null
  draft_script: string | null
  draft_outline: string | null
  user_edited_draft_tweet: string | null
  user_edited_draft_script: string | null
  user_edited_draft_outline: string | null
  review_notes: string | null
  priority_score: number | null
  final_score: number | null
  generation_status: string
  created_at: string
  action: TopicAction
  review_state: ReviewState
  message_count: number
  first_seen_at: string | null
  last_seen_at: string | null
  seen_count: number
  latest_topic_id: number | null
  tags: string[]
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ReviewMessage extends ChatMessage {
  id: number
  topic_id: number
  candidate_id?: number | null
  created_at: string
}

export interface ReviewSignal {
  id: number
  topic_id: number
  candidate_id?: number | null
  message_id?: number | null
  signal_type: ReviewSignalType
  label: string
  polarity: 'positive' | 'negative' | 'neutral'
  strength: number
  created_at: string
}

export interface TopicReviewSession {
  topic: Topic
  messages: ReviewMessage[]
  signals: ReviewSignal[]
}

export interface TopicStats {
  pending: number
  approved: number
  published: number
  skipped: number
  total: number
}

export type PipelineStageName =
  | 'collect'
  | 'profile'
  | 'strategize'
  | 'curate'
  | 'report'

export type PipelineRunStatus =
  | 'running'
  | 'success'
  | 'partial_failure'
  | 'failed'

export type PipelineStageStatus = 'pending' | 'running' | 'complete' | 'failed'

export interface PipelineStage {
  id: number
  stage_name: PipelineStageName
  status: PipelineStageStatus
  progress: number
  message: string | null
  started_at: string
  finished_at: string | null
}

export interface PipelineRun {
  id: number
  status: PipelineRunStatus
  projects_collected: number
  projects_analyzed: number
  topics_generated: number
  triggered_by: 'manual' | 'nightly'
  started_at: string
  finished_at: string | null
  stages: PipelineStage[]
  error_log: string | null
  config: PipelineRunConfig
}

export interface PipelineRunConfig {
  languages: string[]
  limit: number
  source: 'tavily' | 'exa' | 'both' | 'legacy'
  model: string
}

export interface Preference {
  id: number
  positioning: string | null
  preferred_languages: string | null
  min_stars_threshold: number
  local_ai_weight: number
  daily_run_time: string
  auto_publish: boolean
  updated_at: string
}

export interface Weight {
  id: number
  novelty_weight: number
  utility_weight: number
  local_ai_weight: number
  doc_quality_weight: number
  engagement_weight: number
  updated_at: string
}

export interface DashboardState {
  topics: Topic[]
  messages: ReviewMessage[]
  signals: ReviewSignal[]
  pipelineRuns: PipelineRun[]
  activePipelineRunId: number | null
  preferences: Preference
  weights: Weight
  selectedTopicId: number
  candidateView: CandidateView
  poolFilter: TopicPoolFilter | undefined
}

export type TopicContentUpdate = Partial<
  Pick<
    Topic,
    | 'draft_tweet'
    | 'draft_script'
    | 'draft_outline'
    | 'user_edited_draft_tweet'
    | 'user_edited_draft_script'
    | 'user_edited_draft_outline'
  >
>
