import type { PipelineRunConfig } from '#/lib/gtr-dashboard-types'

export const DEFAULT_PIPELINE_MODEL = 'qwen3.6-max-preview'

export const PIPELINE_DEFAULT_CONFIG: PipelineRunConfig = {
  languages: [''],
  limit: 10,
  top_n: 10,
  source: 'legacy',
  model: DEFAULT_PIPELINE_MODEL,
}
