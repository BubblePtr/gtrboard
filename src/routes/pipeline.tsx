import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Progress } from '#/components/ui/progress'
import {
  advancePipelineRun,
  getPipelineRun,
  getPipelineRuns,
  gtrDashboardStore,
  triggerPipeline,
} from '#/lib/gtr-dashboard-store'
import type {
  PipelineRun,
  PipelineRunConfig,
  PipelineStage,
} from '#/lib/gtr-dashboard-types'

export const Route = createFileRoute('/pipeline')({
  component: PipelinePage,
})

const stageLabels: Record<PipelineStage['stage_name'], string> = {
  collect: '收集 Trending 项目',
  profile: '生成项目画像',
  strategize: '规划内容策略',
  curate: '筛选候选选题',
  report: '生成报告和素材',
}

function PipelinePage() {
  const state = useStore(gtrDashboardStore, (storeState) => storeState)
  const [config, setConfig] = useState({
    languages: '',
    limit: 10,
    source: 'legacy' as PipelineRunConfig['source'],
    model: 'qwen3.6-max-preview',
  })

  const runs = getPipelineRuns()
  const activeRun = getPipelineRun(state.activePipelineRunId)
  const activeRunProgress = useMemo(() => getRunProgress(activeRun), [activeRun])

  const handleRun = () => {
    const languages = config.languages
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
    triggerPipeline({
      languages: languages.length > 0 ? languages : [''],
      limit: config.limit,
      source: config.source,
      model: config.model,
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-2">
        <h1 className="m-0 text-2xl font-bold text-slate-950">Pipeline</h1>
        <p className="m-0 max-w-2xl text-sm leading-6 text-slate-500">
          V1 保留旧项目的运行配置和阶段进度体验；实际 Python discovery、
          research、scoring 和 generation 仍待接入后台服务。
        </p>
      </section>

      <section className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card className="rounded-lg border-slate-200 bg-white py-0 shadow-sm">
          <CardHeader className="border-b border-slate-200 px-4 py-3">
            <CardTitle>运行配置</CardTitle>
            <CardDescription>触发一次模拟 discovery pipeline</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 p-4">
            <Field label="语言（逗号分隔）">
              <Input
                value={config.languages}
                placeholder="留空=全语言，或输入 python,go"
                onChange={(event) =>
                  setConfig({ ...config, languages: event.target.value })
                }
              />
            </Field>
            <Field label="数量限制">
              <Input
                type="number"
                min={1}
                max={50}
                value={config.limit}
                onChange={(event) =>
                  setConfig({ ...config, limit: Number(event.target.value) })
                }
              />
            </Field>
            <Field label="数据源">
              <select
                value={config.source}
                onChange={(event) =>
                  setConfig({
                    ...config,
                    source: event.target.value as PipelineRunConfig['source'],
                  })
                }
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <option value="legacy">Legacy (GitHub Trending)</option>
                <option value="tavily">Tavily</option>
                <option value="exa">Exa</option>
                <option value="both">Both</option>
              </select>
            </Field>
            <Field label="模型">
              <Input
                value={config.model}
                onChange={(event) =>
                  setConfig({ ...config, model: event.target.value })
                }
              />
            </Field>
            <Button
              type="button"
              onClick={handleRun}
              disabled={activeRun?.status === 'running'}
            >
              {activeRun?.status === 'running' ? '运行中...' : '启动 Pipeline'}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-lg border-slate-200 bg-white py-0 shadow-sm">
          <CardHeader className="border-b border-slate-200 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>
                  {activeRun ? `运行进度 #${activeRun.id}` : '运行进度'}
                </CardTitle>
                <CardDescription>collect → profile → strategize → curate → report</CardDescription>
              </div>
              {activeRun ? <StatusBadge status={activeRun.status} /> : null}
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 p-4">
            {activeRun ? (
              <>
                <div className="rounded-md bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-slate-700">
                      总体进度
                    </span>
                    <span className="text-slate-500">{activeRunProgress}%</span>
                  </div>
                  <Progress className="mt-2" value={activeRunProgress} />
                </div>
                <div className="flex flex-col gap-3">
                  {activeRun.stages.map((stage) => (
                    <StageRow key={stage.id} stage={stage} />
                  ))}
                </div>
                {activeRun.status === 'running' ? (
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => advancePipelineRun(activeRun.id)}
                    >
                      模拟完成
                    </Button>
                  </div>
                ) : null}
                {activeRun.error_log ? (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                    {activeRun.error_log}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="py-16 text-center text-sm text-slate-400">
                暂无运行记录
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-lg border-slate-200 bg-white py-0 shadow-sm">
        <CardHeader className="border-b border-slate-200 px-4 py-3">
          <CardTitle>历史运行</CardTitle>
          <CardDescription>仅保留运行记录列表，不恢复历史趋势图路由。</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <div className="flex flex-col divide-y divide-slate-100">
            {runs.map((run) => (
              <RunRow key={run.id} run={run} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      {children}
    </label>
  )
}

function StageRow({ stage }: { stage: PipelineStage }) {
  return (
    <div className="rounded-md border border-slate-200 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="m-0 text-sm font-medium text-slate-700">
            {stageLabels[stage.stage_name]}
          </p>
          <p className="m-0 mt-1 text-xs text-slate-500">
            {stage.message ?? stage.stage_name}
          </p>
        </div>
        <StageBadge status={stage.status} />
      </div>
      <Progress className="mt-3" value={stage.progress} />
    </div>
  )
}

function RunRow({ run }: { run: PipelineRun }) {
  const progress = getRunProgress(run)

  return (
    <div className="grid gap-3 px-4 py-3 md:grid-cols-[minmax(0,1fr)_220px] md:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <StatusBadge status={run.status} />
        <div className="min-w-0">
          <p className="m-0 truncate text-sm font-semibold text-slate-800">
            Run #{run.id} · {run.triggered_by}
          </p>
          <p className="m-0 mt-1 text-xs text-slate-500">
            {run.projects_collected} 项目 / {run.projects_analyzed} 画像 /{' '}
            {run.topics_generated} 选题
          </p>
        </div>
      </div>
      <Progress value={progress} />
    </div>
  )
}

function StatusBadge({ status }: { status: PipelineRun['status'] }) {
  const label = {
    running: '运行中',
    success: '成功',
    partial_failure: '部分失败',
    failed: '失败',
  }[status]

  return <Badge variant={status === 'success' ? 'secondary' : 'outline'}>{label}</Badge>
}

function StageBadge({ status }: { status: PipelineStage['status'] }) {
  const label = {
    pending: '等待',
    running: '运行中',
    complete: '完成',
    failed: '失败',
  }[status]

  return <Badge variant={status === 'complete' ? 'secondary' : 'outline'}>{label}</Badge>
}

function getRunProgress(run: PipelineRun | null) {
  if (!run) return 0
  const total = run.stages.reduce((sum, stage) => sum + stage.progress, 0)
  return Math.round(total / run.stages.length)
}
