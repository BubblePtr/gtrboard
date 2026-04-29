import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { createFileRoute } from '@tanstack/react-router'

import type { PipelineRunConfig } from '#/lib/gtr-dashboard-types'
import { DEFAULT_PIPELINE_MODEL } from '#/lib/pipeline-default-config'

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

  const limit = clampNumber(body.limit, 1, 50, 10)
  const topN = Math.min(clampNumber(body.top_n ?? body.limit, 1, 50, limit), limit)

  return {
    languages: languages.length > 0 ? languages : [''],
    limit,
    top_n: topN,
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
    String(config.top_n ?? config.limit),
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
    let stdout = ''

    child.stdout?.on('data', (chunk: Buffer) => {
      stdout += chunk.toString()
    })
    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })
    child.on('error', reject)
    child.on('close', (code: number) => {
      if (code === 0) {
        resolve()
        return
      }
      const output = [stderr, stdout]
        .map((item) => item.trim())
        .filter(Boolean)
        .join('\n')
      reject(new Error(output || `Pipeline exited with code ${code}`))
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
