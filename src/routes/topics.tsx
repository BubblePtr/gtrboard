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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { Textarea } from '#/components/ui/textarea'
import {
  generateAssistantReply,
  getTodayTopics,
  getTopicPool,
  getTopicReviewSession,
  gtrDashboardStore,
  selectTopic,
  triggerPipeline,
  updateTopicAction,
  updateTopicContent,
} from '#/lib/gtr-dashboard-store'
import type {
  CandidateView,
  ReviewMessage,
  ReviewSignal,
  Topic,
  TopicPoolFilter,
  TopicReviewSession,
} from '#/lib/gtr-dashboard-types'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/topics')({
  component: TopicsPage,
})

const poolFilters: Array<{ label: string; value: TopicPoolFilter | undefined }> =
  [
    { label: '全部', value: undefined },
    { label: '待聊', value: 'pending' },
    { label: '对话中', value: 'chatting' },
    { label: '已采纳', value: 'approved' },
    { label: '已跳过', value: 'skipped' },
  ]

const quickPrompts = [
  '这个项目适合做短视频还是图文？',
  '帮我找一个更有冲突感的差异化角度。',
  '如果要采纳，封面图和开场脚本怎么做？',
]

function TopicsPage() {
  const state = useStore(gtrDashboardStore, (storeState) => storeState)
  const [view, setView] = useState<CandidateView>(state.candidateView)
  const [poolFilter, setPoolFilter] = useState<TopicPoolFilter | undefined>(
    state.poolFilter,
  )
  const [inputValue, setInputValue] = useState('')
  const [decisionNote, setDecisionNote] = useState('')
  const [contextOpen, setContextOpen] = useState(true)

  const candidates = view === 'today' ? getTodayTopics(8) : getTopicPool(poolFilter)
  const selectedId = state.selectedTopicId
  const session = useMemo(
    () => getTopicReviewSession(selectedId),
    [selectedId, state.messages, state.signals, state.topics],
  )

  const sendMessage = (message: string) => {
    const text = message.trim()
    if (!text) return
    generateAssistantReply(session.topic.id, text)
    setInputValue('')
  }

  const decide = (action: 'approved' | 'skipped') => {
    updateTopicAction(session.topic.id, action, decisionNote)
    setDecisionNote('')
  }

  return (
    <div className="flex min-h-[calc(100vh-7rem)] flex-col gap-4">
      <section className="flex flex-col justify-between gap-3 xl:flex-row xl:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="m-0 text-2xl font-bold text-slate-950">
            今日选题工作台
          </h1>
          <p className="m-0 text-sm text-slate-500">
            Agent 每天筛出 5-8 个候选，通过对话审稿并沉淀长期偏好。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">自动抓取 09:00</Badge>
          <Badge variant="outline">GitHub Trending</Badge>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              triggerPipeline({
                languages: [''],
                limit: 5,
                source: 'legacy',
                model: 'qwen3.6-max-preview',
              })
            }
          >
            重新发现
          </Button>
        </div>
      </section>

      <section
        className={cn(
          'grid flex-1 gap-4',
          contextOpen
            ? 'xl:grid-cols-[300px_minmax(0,1fr)_340px]'
            : 'xl:grid-cols-[320px_minmax(0,1fr)]',
        )}
      >
        <CandidateList
          candidates={candidates}
          selectedTopicId={selectedId}
          view={view}
          poolFilter={poolFilter}
          onViewChange={setView}
          onPoolFilterChange={setPoolFilter}
        />
        <ChatWorkspace
          session={session}
          inputValue={inputValue}
          contextOpen={contextOpen}
          onInputChange={setInputValue}
          onSend={sendMessage}
          onToggleContext={() => setContextOpen((open) => !open)}
        />
        {contextOpen ? (
          <ContextPanel
            session={session}
            decisionNote={decisionNote}
            onDecisionNoteChange={setDecisionNote}
            onApprove={() => decide('approved')}
            onSkip={() => decide('skipped')}
            onClose={() => setContextOpen(false)}
          />
        ) : null}
      </section>
    </div>
  )
}

function CandidateList({
  candidates,
  selectedTopicId,
  view,
  poolFilter,
  onViewChange,
  onPoolFilterChange,
}: {
  candidates: Topic[]
  selectedTopicId: number
  view: CandidateView
  poolFilter: TopicPoolFilter | undefined
  onViewChange: (view: CandidateView) => void
  onPoolFilterChange: (filter: TopicPoolFilter | undefined) => void
}) {
  return (
    <Card className="min-h-[420px] rounded-lg border-slate-200 bg-white py-0 shadow-sm">
      <CardHeader className="border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle>{view === 'today' ? '今日候选' : '候选池'}</CardTitle>
          <Badge variant="outline">{candidates.length}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-1 rounded-md bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => onViewChange('today')}
            className={cn(
              'rounded px-2 py-1.5 text-xs font-medium text-slate-500 transition',
              view === 'today' && 'bg-white text-slate-950 shadow-sm',
            )}
          >
            今日
          </button>
          <button
            type="button"
            onClick={() => onViewChange('pool')}
            className={cn(
              'rounded px-2 py-1.5 text-xs font-medium text-slate-500 transition',
              view === 'pool' && 'bg-white text-slate-950 shadow-sm',
            )}
          >
            候选池
          </button>
        </div>
        {view === 'pool' ? (
          <div className="flex flex-wrap gap-1.5">
            {poolFilters.map((filter) => (
              <button
                key={filter.label}
                type="button"
                onClick={() => onPoolFilterChange(filter.value)}
                className={cn(
                  'rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-500',
                  poolFilter === filter.value && 'bg-slate-950 text-white',
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="flex max-h-[calc(100vh-16rem)] flex-col gap-2 overflow-y-auto p-3">
        {candidates.length > 0 ? (
          candidates.map((topic) => (
            <button
              key={topic.id}
              type="button"
              onClick={() => selectTopic(topic.id)}
              className={cn(
                'rounded-md border p-3 text-left transition',
                topic.id === selectedTopicId
                  ? 'border-slate-950 bg-slate-950 text-white'
                  : 'border-slate-200 bg-white text-slate-950 hover:bg-slate-50',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="m-0 truncate text-sm font-semibold">
                    {topic.project_name}
                  </p>
                  <p
                    className={cn(
                      'm-0 truncate text-xs',
                      topic.id === selectedTopicId
                        ? 'text-slate-300'
                        : 'text-slate-500',
                    )}
                  >
                    {topic.language} · {topic.stars.toLocaleString()} stars
                  </p>
                </div>
                <Badge variant={topic.id === selectedTopicId ? 'secondary' : 'outline'}>
                  {topic.final_score?.toFixed(1)}
                </Badge>
              </div>
              <p
                className={cn(
                  'm-0 mt-3 line-clamp-2 text-xs leading-5',
                  topic.id === selectedTopicId ? 'text-slate-200' : 'text-slate-500',
                )}
              >
                {topic.differentiation_angle}
              </p>
              <div className="mt-3 flex flex-wrap gap-1">
                {topic.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className={cn(
                      'rounded bg-slate-100 px-1.5 py-0.5 text-[11px]',
                      topic.id === selectedTopicId
                        ? 'bg-white/10 text-slate-100'
                        : 'text-slate-500',
                    )}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          ))
        ) : (
          <div className="py-12 text-center text-sm text-slate-400">
            当前筛选没有候选
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ChatWorkspace({
  session,
  inputValue,
  contextOpen,
  onInputChange,
  onSend,
  onToggleContext,
}: {
  session: TopicReviewSession
  inputValue: string
  contextOpen: boolean
  onInputChange: (value: string) => void
  onSend: (value: string) => void
  onToggleContext: () => void
}) {
  const topic = session.topic

  return (
    <Card className="min-h-[560px] rounded-lg border-slate-200 bg-white py-0 shadow-sm">
      <CardHeader className="border-b border-slate-200 px-4 py-3">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline">{topic.review_state}</Badge>
              <Badge variant="secondary">{topic.engagement_estimate}</Badge>
            </div>
            <CardTitle className="truncate text-xl">
              {topic.project_name}
            </CardTitle>
            <CardDescription className="mt-1">
              {topic.github_url} · {topic.language}
            </CardDescription>
          </div>
          <Button type="button" variant="outline" onClick={onToggleContext}>
            {contextOpen ? '隐藏上下文' : '显示上下文'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-4 p-4">
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <p className="m-0 text-sm leading-6 text-slate-700">{topic.why_post}</p>
          <p className="m-0 mt-2 text-sm leading-6 text-slate-500">
            {topic.differentiation_angle}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((prompt) => (
            <Button
              key={prompt}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onSend(prompt)}
            >
              {prompt}
            </Button>
          ))}
        </div>

        <div className="flex min-h-[300px] flex-1 flex-col gap-3 overflow-y-auto rounded-md border border-slate-200 bg-white p-3">
          {session.messages.length > 0 ? (
            session.messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          ) : (
            <div className="grid min-h-64 place-items-center text-center">
              <div className="max-w-md">
                <p className="m-0 text-sm font-semibold text-slate-700">
                  还没有开始对话
                </p>
                <p className="m-0 mt-2 text-sm leading-6 text-slate-500">
                  先问一个内容角度问题，AI 会把偏好、顾虑和采纳理由沉淀到上下文。
                </p>
              </div>
            </div>
          )}
        </div>

        <form
          className="flex flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            onSend(inputValue)
          }}
        >
          <Textarea
            value={inputValue}
            onChange={(event) => onInputChange(event.target.value)}
            placeholder="和 AI 讨论这个项目是否值得做、适合什么内容形式、需要哪些素材..."
            className="min-h-24 resize-none"
          />
          <div className="flex justify-end">
            <Button type="submit">发送</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function ContextPanel({
  session,
  decisionNote,
  onDecisionNoteChange,
  onApprove,
  onSkip,
  onClose,
}: {
  session: TopicReviewSession
  decisionNote: string
  onDecisionNoteChange: (value: string) => void
  onApprove: () => void
  onSkip: () => void
  onClose: () => void
}) {
  const topic = session.topic

  return (
    <Card className="rounded-lg border-slate-200 bg-white py-0 shadow-sm">
      <CardHeader className="border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>上下文与决策</CardTitle>
            <CardDescription>信号、草稿和人工反馈</CardDescription>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            关闭
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex max-h-[calc(100vh-12rem)] flex-col gap-4 overflow-y-auto p-4">
        <div className="flex flex-col gap-2">
          <PanelTitle label="Review signals" />
          {session.signals.length > 0 ? (
            <div className="flex flex-col gap-2">
              {session.signals.map((signal) => (
                <SignalRow key={signal.id} signal={signal} />
              ))}
            </div>
          ) : (
            <p className="m-0 rounded-md bg-slate-50 p-3 text-sm text-slate-400">
              暂无沉淀信号
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <PanelTitle label="Draft artifacts" />
          <Tabs defaultValue="tweet">
            <TabsList>
              <TabsTrigger value="tweet">推文</TabsTrigger>
              <TabsTrigger value="script">脚本</TabsTrigger>
              <TabsTrigger value="outline">大纲</TabsTrigger>
            </TabsList>
            <DraftTab
              value="tweet"
              content={topic.user_edited_draft_tweet ?? topic.draft_tweet ?? ''}
              onChange={(content) =>
                updateTopicContent(topic.id, { user_edited_draft_tweet: content })
              }
            />
            <DraftTab
              value="script"
              content={topic.user_edited_draft_script ?? topic.draft_script ?? ''}
              onChange={(content) =>
                updateTopicContent(topic.id, {
                  user_edited_draft_script: content,
                  draft_script: content,
                })
              }
            />
            <DraftTab
              value="outline"
              content={topic.user_edited_draft_outline ?? topic.draft_outline ?? ''}
              onChange={(content) =>
                updateTopicContent(topic.id, { user_edited_draft_outline: content })
              }
            />
          </Tabs>
        </div>

        <div className="flex flex-col gap-2">
          <PanelTitle label="Decision note" />
          <Textarea
            value={decisionNote}
            onChange={(event) => onDecisionNoteChange(event.target.value)}
            placeholder="写下采纳或跳过理由，用于未来 scoring 偏好。"
            className="min-h-24 resize-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" onClick={onSkip}>
              跳过
            </Button>
            <Button type="button" onClick={onApprove}>
              采纳
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function DraftTab({
  value,
  content,
  onChange,
}: {
  value: string
  content: string
  onChange: (content: string) => void
}) {
  return (
    <TabsContent value={value}>
      <Textarea
        value={content}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-36 resize-none text-sm leading-6"
      />
    </TabsContent>
  )
}

function MessageBubble({ message }: { message: ReviewMessage }) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[78%] rounded-lg px-3 py-2 text-sm leading-6',
          isUser
            ? 'bg-slate-950 text-white'
            : 'border border-slate-200 bg-slate-50 text-slate-700',
        )}
      >
        {message.content}
      </div>
    </div>
  )
}

function SignalRow({ signal }: { signal: ReviewSignal }) {
  const polarityClass = {
    positive: 'bg-emerald-50 text-emerald-700',
    negative: 'bg-rose-50 text-rose-700',
    neutral: 'bg-slate-100 text-slate-700',
  }[signal.polarity]

  return (
    <div className="rounded-md border border-slate-200 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium text-slate-700">
          {signal.label}
        </span>
        <span className={`rounded px-2 py-0.5 text-[11px] ${polarityClass}`}>
          {Math.round(signal.strength * 100)}%
        </span>
      </div>
      <p className="m-0 mt-1 text-xs text-slate-500">{signal.signal_type}</p>
    </div>
  )
}

function PanelTitle({ label }: { label: string }) {
  return <h3 className="m-0 text-xs font-semibold uppercase text-slate-500">{label}</h3>
}
