import { createFileRoute } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'

import { Badge } from '#/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import {
  getPreferences,
  getWeights,
  gtrDashboardStore,
  updatePreferences,
  updateWeights,
} from '#/lib/gtr-dashboard-store'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  useStore(gtrDashboardStore, (state) => state)
  const preferences = getPreferences()
  const weights = getWeights()

  return (
    <div className="flex max-w-4xl flex-col gap-5">
      <section className="flex flex-col gap-2">
        <h1 className="m-0 text-2xl font-bold text-slate-950">设置</h1>
        <p className="m-0 max-w-2xl text-sm leading-6 text-slate-500">
          保存内容定位、每日运行时间和 scoring 权重。V1 使用本地状态模拟，
          后续可映射到 Python service 的 preferences API。
        </p>
      </section>

      <Card className="rounded-lg border-slate-200 bg-white py-0 shadow-sm">
        <CardHeader className="border-b border-slate-200 px-4 py-3">
          <CardTitle>用户偏好</CardTitle>
          <CardDescription>用于 nightly scoring 和对话上下文</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 p-4 md:grid-cols-2">
          <Field label="定位">
            <Input
              value={preferences.positioning ?? ''}
              onChange={(event) =>
                updatePreferences({ positioning: event.target.value })
              }
            />
          </Field>
          <Field label="偏好语言">
            <Input
              value={preferences.preferred_languages ?? ''}
              onChange={(event) =>
                updatePreferences({ preferred_languages: event.target.value })
              }
            />
          </Field>
          <Field label="最低星标数">
            <Input
              type="number"
              min={0}
              value={preferences.min_stars_threshold}
              onChange={(event) =>
                updatePreferences({
                  min_stars_threshold: Number(event.target.value),
                })
              }
            />
          </Field>
          <Field label="本地 AI 权重">
            <Input
              type="number"
              step={0.05}
              min={0}
              max={1}
              value={preferences.local_ai_weight}
              onChange={(event) =>
                updatePreferences({ local_ai_weight: Number(event.target.value) })
              }
            />
          </Field>
          <Field label="每日运行时间">
            <Input
              type="time"
              value={preferences.daily_run_time}
              onChange={(event) =>
                updatePreferences({ daily_run_time: event.target.value })
              }
            />
          </Field>
          <label className="flex items-center gap-3 rounded-md border border-slate-200 p-3">
            <input
              type="checkbox"
              checked={preferences.auto_publish}
              onChange={(event) =>
                updatePreferences({ auto_publish: event.target.checked })
              }
              className="size-4 rounded border-slate-300"
            />
            <span className="text-sm font-medium text-slate-700">自动发布</span>
          </label>
        </CardContent>
      </Card>

      <Card className="rounded-lg border-slate-200 bg-white py-0 shadow-sm">
        <CardHeader className="border-b border-slate-200 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>评分权重</CardTitle>
              <CardDescription>用于计算 candidate final_score</CardDescription>
            </div>
            <Badge variant="outline">总计 {getWeightTotal(weights)}%</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 p-4">
          <WeightSlider
            label="新颖度"
            value={weights.novelty_weight}
            onChange={(value) => updateWeights({ novelty_weight: value })}
          />
          <WeightSlider
            label="实用性"
            value={weights.utility_weight}
            onChange={(value) => updateWeights({ utility_weight: value })}
          />
          <WeightSlider
            label="本地 AI 相关性"
            value={weights.local_ai_weight}
            onChange={(value) => updateWeights({ local_ai_weight: value })}
          />
          <WeightSlider
            label="文档质量"
            value={weights.doc_quality_weight}
            onChange={(value) => updateWeights({ doc_quality_weight: value })}
          />
          <WeightSlider
            label="互动潜力"
            value={weights.engagement_weight}
            onChange={(value) => updateWeights({ engagement_weight: value })}
          />
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

function WeightSlider({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm text-slate-500">{Math.round(value * 100)}%</span>
      </span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-slate-950"
      />
    </label>
  )
}

function getWeightTotal(weights: ReturnType<typeof getWeights>) {
  const total =
    weights.novelty_weight +
    weights.utility_weight +
    weights.local_ai_weight +
    weights.doc_quality_weight +
    weights.engagement_weight

  return Math.round(total * 100)
}
