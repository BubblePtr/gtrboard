import { describe, expect, it } from 'vitest'

import { createPipelineRunFromArtifact } from './pipeline-result'
import type { PipelineArtifact } from './pipeline-result'

describe('createPipelineRunFromArtifact', () => {
  it('uses a stage id range that does not collide for adjacent runs', () => {
    const first = createPipelineRunFromArtifact({
      artifact: createArtifactWithStages(12),
      config: {
        languages: [''],
        limit: 12,
        top_n: 12,
        source: 'legacy',
        model: 'qwen3.6-max-preview',
      },
      runId: 1,
    })
    const second = createPipelineRunFromArtifact({
      artifact: createArtifactWithStages(12),
      config: {
        languages: [''],
        limit: 12,
        top_n: 12,
        source: 'legacy',
        model: 'qwen3.6-max-preview',
      },
      runId: 2,
    })

    const ids = [...first.stages, ...second.stages].map((stage) => stage.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

function createArtifactWithStages(stageCount: number): PipelineArtifact {
  return {
    status: 'success',
    projects_collected: 1,
    projects_analyzed: 1,
    topics_generated: 1,
    report_path: 'reports/daily_report.md',
    error_log: null,
    started_at: '2026-04-29T08:00:00.000Z',
    finished_at: '2026-04-29T08:00:01.000Z',
    stages: Array.from({ length: stageCount }, (_, index) => ({
      name: 'collect',
      status: 'complete',
      progress: 100,
      message: `stage ${index}`,
      started_at: '2026-04-29T08:00:00.000Z',
      finished_at: '2026-04-29T08:00:01.000Z',
    })),
    topics: [],
  }
}
