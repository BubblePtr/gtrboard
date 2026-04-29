import type {
  PipelineRun,
  PipelineRunConfig,
  PipelineStage,
  Topic,
} from '#/lib/gtr-dashboard-types'

export interface PipelineArtifact {
  status: PipelineRun['status']
  projects_collected: number
  projects_analyzed: number
  topics_generated: number
  report_path: string
  error_log: string | null
  started_at: string
  finished_at: string | null
  stages: Array<{
    name: PipelineStage['stage_name']
    status: PipelineStage['status']
    progress: number
    message: string | null
    started_at: string
    finished_at: string | null
  }>
  topics: Array<{
    rank: number
    final_score: number
    selection_reason: string
    project_name: string
    github_url: string
    language: string
    stars: number
    why_post: string
    differentiation_angle: string
    target_audience: string
    engagement_estimate: string
    draft_tweet: string
    draft_script: string
    draft_outline: string
    tags: string[]
    analysis_status?: string
    analysis_reason?: string | null
    generation_status: string
    generation_reason?: string | null
  }>
}

export interface PipelineApplyInput {
  artifact: PipelineArtifact
  config: PipelineRunConfig
  runId: number
  topicIdStart: number
  candidateIdStart: number
  profileIdStart: number
}

export function createPipelineRunFromArtifact({
  artifact,
  config,
  runId,
}: Pick<PipelineApplyInput, 'artifact' | 'config' | 'runId'>): PipelineRun {
  return {
    id: runId,
    status: artifact.status,
    projects_collected: artifact.projects_collected,
    projects_analyzed: artifact.projects_analyzed,
    topics_generated: artifact.topics_generated,
    triggered_by: 'manual',
    started_at: artifact.started_at,
    finished_at: artifact.finished_at,
    error_log: artifact.error_log,
    config: {
      ...config,
      languages: [...config.languages],
    },
    stages: artifact.stages.map((stage, index) => ({
      id: runId * 10 + index,
      stage_name: stage.name,
      status: stage.status,
      progress: stage.progress,
      message: stage.message,
      started_at: stage.started_at,
      finished_at: stage.finished_at,
    })),
  }
}

export function createTopicsFromPipelineArtifact({
  artifact,
  topicIdStart,
  candidateIdStart,
  profileIdStart,
}: Omit<PipelineApplyInput, 'config' | 'runId'>): Topic[] {
  const createdAt = artifact.finished_at ?? artifact.started_at

  return artifact.topics.map((item, index) => ({
    id: topicIdStart + index,
    candidate_id: candidateIdStart + index,
    profile_id: profileIdStart + index,
    project_name: item.project_name,
    github_url: item.github_url,
    language: item.language,
    stars: item.stars,
    forks: 0,
    why_post: item.why_post,
    differentiation_angle: item.differentiation_angle,
    target_audience: item.target_audience,
    engagement_estimate: normalizeEngagementLabel(item.engagement_estimate),
    draft_tweet: item.draft_tweet,
    draft_script: item.draft_script,
    draft_outline: item.draft_outline,
    user_edited_draft_tweet: null,
    user_edited_draft_script: null,
    user_edited_draft_outline: null,
    review_notes: item.selection_reason,
    priority_score: item.final_score * 10,
    final_score: item.final_score * 10,
    generation_status: formatGenerationStatus(item),
    created_at: createdAt,
    action: 'pending',
    review_state: '未聊',
    message_count: 0,
    first_seen_at: createdAt,
    last_seen_at: createdAt,
    seen_count: 1,
    latest_topic_id: null,
    tags: item.tags,
  }))
}

function formatGenerationStatus(item: PipelineArtifact['topics'][number]) {
  const analysisStatus = item.analysis_status ?? 'unknown'
  const generationStatus = item.generation_status ?? 'unknown'
  if (analysisStatus === 'complete' && generationStatus === 'complete') {
    return 'complete'
  }
  if (analysisStatus === 'complete') {
    return generationStatus
  }
  return `${generationStatus}:${analysisStatus}`
}

function normalizeEngagementLabel(value: string) {
  if (value === 'high') return '高互动'
  if (value === 'low') return '小众深度'
  return '中高互动'
}
