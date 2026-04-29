import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { createFileRoute } from '@tanstack/react-router'

import type { PipelineRunConfig } from '#/lib/gtr-dashboard-types'

const DEFAULT_PIPELINE_MODEL = 'qwen3.6-max-preview'

export const Route = createFileRoute('/api/pipeline/run')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as Partial<PipelineRunConfig>
          const config = normalizePipelineConfig(body)
          const artifact = await runPythonPipeline(config)

          return Response.json({ artifact, config })
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Pipeline run failed'

          return Response.json({ error: message }, { status: 500 })
        }
      },
    },
  },
})

function normalizePipelineConfig(body: Partial<PipelineRunConfig>): PipelineRunConfig {
  const languages = Array.isArray(body.languages)
    ? body.languages.filter((item): item is string => typeof item === 'string')
    : ['']

  return {
    languages: languages.length > 0 ? languages : [''],
    limit: clampNumber(body.limit, 1, 50, 10),
    source: 'legacy',
    model: body.model || process.env.OPENAI_MODEL || DEFAULT_PIPELINE_MODEL,
  }
}

async function runPythonPipeline(config: PipelineRunConfig) {
  const cwd = process.cwd()
  const outputDir = path.join(
    cwd,
    'public',
    'pipeline-results',
  )
  const args = [
    '-m',
    'gtrboard_pipeline',
    'run',
    '--source',
    config.source,
    '--limit',
    String(config.limit),
    '--top-n',
    String(config.limit),
    '--model',
    config.model,
    '--output-dir',
    outputDir,
  ]

  for (const language of config.languages) {
    if (language.trim()) {
      args.push('--lang', language.trim())
    }
  }

  await spawnProcess('python3', args, {
    cwd,
    env: {
      ...process.env,
      PYTHONDONTWRITEBYTECODE: '1',
      PYTHONPATH: path.join(cwd, 'services', 'pipeline', 'src'),
    },
  })

  const artifactPath = path.join(outputDir, 'latest_pipeline_run.json')
  const artifactText = await readFile(artifactPath, 'utf8')
  return JSON.parse(artifactText)
}

function spawnProcess(
  command: string,
  args: string[],
  options: Record<string, unknown>,
) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, options)
    let stderr = ''

    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })
    child.on('error', reject)
    child.on('close', (code: number) => {
      if (code === 0) {
        resolve()
        return
      }
      reject(new Error(stderr.trim() || `Pipeline exited with code ${code}`))
    })
  })
}

function clampNumber(
  value: number | undefined,
  min: number,
  max: number,
  fallback: number,
) {
  if (!Number.isFinite(value)) return fallback
  return Math.max(min, Math.min(max, Number(value)))
}
