import { applyPipelineResult } from '#/lib/gtr-dashboard-store'
import type { PipelineRunConfig } from '#/lib/gtr-dashboard-types'
import type { PipelineArtifact } from '#/lib/pipeline-result'

interface PipelineRunResponse {
  artifact: PipelineArtifact
  config: PipelineRunConfig
}

export async function loadLatestPipelineResult(config: PipelineRunConfig) {
  const response = await fetch('/api/pipeline/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string
    } | null
    throw new Error(body?.error || 'Pipeline run failed')
  }

  const body = await response.json()
  if (!isPipelineRunResponse(body)) {
    throw new Error('Pipeline run returned invalid payload')
  }
  return applyPipelineResult(body.artifact, body.config)
}

function isPipelineRunResponse(body: unknown): body is PipelineRunResponse {
  if (!body || typeof body !== 'object') return false
  const value = body as Record<string, unknown>
  return Boolean(value.artifact && value.config)
}
