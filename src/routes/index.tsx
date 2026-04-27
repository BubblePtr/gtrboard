import { createFileRoute, Link } from '@tanstack/react-router'
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
import { Progress } from '#/components/ui/progress'
import {
  getPipelineRuns,
  getTodayTopics,
  getTopicStats,
  gtrDashboardStore,
} from '#/lib/gtr-dashboard-store'
import type { PipelineRun, Topic, TopicAction } from '#/lib/gtr-dashboard-types'

export const Route = createFileRoute('/')({
  component: DashboardPage,
})

const statLabels: Record<TopicAction, string> = {
  pending: '待审核',
  approved: '已采纳',
  published: '已发布',
  skipped: '已跳过',
}

function DashboardPage() {
  useStore(gtrDashboardStore, (state) => state)
  const stats = getTopicStats()
  const latestTopics = getTodayTopics(5)
  const runs = getPipelineRuns().slice(0, 5)

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div className="flex flex-col gap-2">
          <h1 className="m-0 text-2xl font-bold text-slate-950">Dashboard</h1>
          <p className="m-0 max-w-2xl text-sm leading-6 text-slate-500">
            夜间任务自动发现 GitHub Trending 项目，人工通过对话评估选题价值，
            反馈会回流到下一轮 scoring。
          </p>
        </div>
        <Button asChild>
          <Link to="/topics" className="no-underline">
            进入选题工作台
          </Link>
        </Button>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={statLabels.pending} value={stats.pending} tone="amber" />
        <StatCard label={statLabels.approved} value={stats.approved} tone="emerald" />
        <StatCard label={statLabels.published} value={stats.published} tone="sky" />
        <StatCard label={statLabels.skipped} value={stats.skipped} tone="slate" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="gap-0 rounded-lg border-slate-200 bg-white py-0 shadow-sm">
          <CardHeader className="border-b border-slate-200 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>最新待审选题</CardTitle>
                <CardDescription>来自今日候选与仍在对话中的项目</CardDescription>
              </div>
              <Badge variant="outline">前 5 条</Badge>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            {latestTopics.length > 0 ? (
              <div className="flex flex-col divide-y divide-slate-100">
                {latestTopics.map((topic) => (
                  <TopicRow key={topic.id} topic={topic} />
                ))}
              </div>
            ) : (
              <EmptyState label="暂无待审选题" />
            )}
          </CardContent>
        </Card>

        <Card className="gap-0 rounded-lg border-slate-200 bg-white py-0 shadow-sm">
          <CardHeader className="border-b border-slate-200 px-4 py-3">
            <CardTitle>最近 Pipeline 运行</CardTitle>
            <CardDescription>collect → profile → strategize → curate → report</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            {runs.length > 0 ? (
              <div className="flex flex-col divide-y divide-slate-100">
                {runs.map((run) => (
                  <PipelineRow key={run.id} run={run} />
                ))}
              </div>
            ) : (
              <EmptyState label="暂无运行记录" />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'amber' | 'emerald' | 'sky' | 'slate'
}) {
  const toneClass = {
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    sky: 'bg-sky-50 text-sky-700 border-sky-100',
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
  }[tone]

  return (
    <Card className={`rounded-lg py-0 shadow-sm ${toneClass}`}>
      <CardContent className="flex min-h-28 flex-col justify-between gap-4 p-4">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-3xl font-bold text-slate-950">{value}</span>
      </CardContent>
    </Card>
  )
}

function TopicRow({ topic }: { topic: Topic }) {
  return (
    <Link
      to="/topics"
      className="block px-4 py-3 text-slate-950 no-underline transition hover:bg-slate-50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="m-0 truncate text-sm font-semibold">
              {topic.project_name ?? '未知项目'}
            </p>
            <Badge variant="secondary">{topic.final_score?.toFixed(1)}</Badge>
          </div>
          <p className="m-0 mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
            {topic.differentiation_angle ?? '暂无差异化角度'}
          </p>
        </div>
        <Badge variant="outline">{topic.engagement_estimate}</Badge>
      </div>
    </Link>
  )
}

function PipelineRow({ run }: { run: PipelineRun }) {
  const completeStages = run.stages.filter(
    (stage) => stage.status === 'complete',
  ).length
  const progress = Math.round((completeStages / run.stages.length) * 100)

  return (
    <div className="flex flex-col gap-2 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="m-0 truncate text-sm font-semibold">Run #{run.id}</p>
          <p className="m-0 text-xs text-slate-500">
            {run.projects_collected} 项目 / {run.topics_generated} 选题
          </p>
        </div>
        <StatusBadge status={run.status} />
      </div>
      <Progress value={run.status === 'running' ? progress || 12 : progress} />
    </div>
  )
}

function StatusBadge({ status }: { status: PipelineRun['status'] }) {
  const label = {
    success: '成功',
    partial_failure: '部分失败',
    failed: '失败',
    running: '运行中',
  }[status]

  const variant = status === 'success' ? 'secondary' : 'outline'

  return <Badge variant={variant}>{label}</Badge>
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="px-4 py-10 text-center text-sm text-slate-400">{label}</div>
  )
}
