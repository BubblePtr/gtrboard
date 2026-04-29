import { useMemo, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
} from '#/components/ui/card'
import { Textarea } from '#/components/ui/textarea'
import {
  appendTopicMessage,
  applyTopicReviewWriteback,
  getPreferences,
  getTodayTopics,
  getTopicPool,
  getTopicReviewSession,
  gtrDashboardStore,
  selectTopic,
} from '#/lib/gtr-dashboard-store'
import { PIPELINE_DEFAULT_CONFIG } from '#/lib/pipeline-default-config'
import { loadLatestPipelineResult } from '#/lib/pipeline-client'
import type {
  CandidateView,
  ReviewMessage,
  Topic,
  TopicPoolFilter,
  TopicReviewSession,
} from '#/lib/gtr-dashboard-types'
import type { TopicReviewWritebackResponse } from '#/lib/topic-review-writeback'
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

type LocalChatMessage = {
  id: number | string
  role: ReviewMessage['role']
  content: string
}

function TopicsPage() {
  const state = useStore(gtrDashboardStore, (storeState) => storeState)
  const [view, setView] = useState<CandidateView>(state.candidateView)
  const [poolFilter, setPoolFilter] = useState<TopicPoolFilter | undefined>(
    state.poolFilter,
  )
  const [inputValue, setInputValue] = useState('')
  const [isRediscovering, setIsRediscovering] = useState(false)
  const [rediscoverError, setRediscoverError] = useState<string | null>(null)

  const candidates = view === 'today' ? getTodayTopics(8) : getTopicPool(poolFilter)
  const selectedId = state.selectedTopicId
  const session = useMemo(
    () => (selectedId ? getTopicReviewSession(selectedId) : null),
    [selectedId, state.messages, state.signals, state.topics],
  )

  return (
    <div className="h-full overflow-hidden bg-[#fafafa]">
      <section
        className="grid h-full grid-rows-[minmax(0,0.48fr)_minmax(0,0.52fr)] gap-2 overflow-hidden bg-[#fafafa] xl:grid-cols-[360px_minmax(0,1fr)] xl:grid-rows-none"
      >
        <CandidateList
          candidates={candidates}
          selectedTopicId={selectedId}
          view={view}
          poolFilter={poolFilter}
          onViewChange={setView}
          onPoolFilterChange={setPoolFilter}
          isRediscovering={isRediscovering}
          rediscoverError={rediscoverError}
          onRediscover={async () => {
            setIsRediscovering(true)
            setRediscoverError(null)
            try {
              await loadLatestPipelineResult({
                ...PIPELINE_DEFAULT_CONFIG,
                limit: 5,
                top_n: 5,
              })
            } catch (error) {
              setRediscoverError(
                error instanceof Error ? error.message : '重新发现失败',
              )
            } finally {
              setIsRediscovering(false)
            }
          }}
        />
        {session ? (
          <ChatWorkspace
            key={session.topic.id}
            session={session}
            inputValue={inputValue}
            onInputChange={setInputValue}
          />
        ) : (
          <EmptyTopicWorkspace />
        )}
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
  onRediscover,
  isRediscovering,
  rediscoverError,
}: {
  candidates: Topic[]
  selectedTopicId: number | null
  view: CandidateView
  poolFilter: TopicPoolFilter | undefined
  onViewChange: (view: CandidateView) => void
  onPoolFilterChange: (filter: TopicPoolFilter | undefined) => void
  onRediscover: () => void
  isRediscovering: boolean
  rediscoverError: string | null
}) {
  return (
    <Card className="h-full overflow-hidden rounded-[24px] border-slate-200/70 bg-white py-0 shadow-none">
      <CardHeader className="gap-4 px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="m-0 truncate text-xl font-bold text-slate-950">
              今日选题工作台
            </h1>
            <p className="m-0 mt-1 text-xs leading-5 text-slate-500">
              Agent 筛选候选，通过对话沉淀长期偏好。
            </p>
          </div>
          <Badge variant="outline">{candidates.length}</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="bg-white">
            自动抓取 09:00
          </Badge>
          <Badge variant="outline" className="bg-white">
            GitHub Trending
          </Badge>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRediscover}
            disabled={isRediscovering}
          >
            {isRediscovering ? '发现中...' : '重新发现'}
          </Button>
        </div>
        {rediscoverError ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
            {rediscoverError}
          </div>
        ) : null}
        <div className="grid grid-cols-2 gap-1 rounded-full bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => onViewChange('today')}
            className={cn(
              'rounded-full px-2 py-1.5 text-xs font-medium text-slate-500 transition',
              view === 'today' && 'bg-white text-slate-950',
            )}
          >
            今日
          </button>
          <button
            type="button"
            onClick={() => onViewChange('pool')}
            className={cn(
              'rounded-full px-2 py-1.5 text-xs font-medium text-slate-500 transition',
              view === 'pool' && 'bg-white text-slate-950',
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
                  poolFilter === filter.value && 'bg-slate-900 text-white',
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 pb-4">
        {candidates.length > 0 ? (
          candidates.map((topic) => (
            <button
              key={topic.id}
              type="button"
              onClick={() => selectTopic(topic.id)}
              className={cn(
                'rounded-2xl border p-3.5 text-left transition',
                topic.id === selectedTopicId
                  ? 'border-slate-300 bg-slate-100 text-slate-950'
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
                      topic.id === selectedTopicId ? 'text-slate-600' : 'text-slate-500',
                    )}
                  >
                    {topic.language} · {topic.stars.toLocaleString()} stars
                  </p>
                </div>
                <Badge variant="outline" className="bg-white">
                  {topic.final_score?.toFixed(1)}
                </Badge>
              </div>
              <p
                className={cn(
                  'm-0 mt-3 line-clamp-2 text-xs leading-5',
                  topic.id === selectedTopicId ? 'text-slate-600' : 'text-slate-500',
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
                        ? 'bg-white text-slate-600'
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

function EmptyTopicWorkspace() {
  return (
    <Card className="h-full overflow-hidden rounded-[24px] border-slate-200/70 bg-white py-0 shadow-none">
      <CardContent className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <h2 className="m-0 text-lg font-semibold text-slate-900">
          先运行一次 Pipeline
        </h2>
        <p className="m-0 max-w-sm text-sm leading-6 text-slate-500">
          点击左侧“重新发现”，从 GitHub Trending 拉取候选项目后再开始选题讨论。
        </p>
      </CardContent>
    </Card>
  )
}

function ChatWorkspace({
  session,
  inputValue,
  onInputChange,
}: {
  session: TopicReviewSession
  inputValue: string
  onInputChange: (value: string) => void
}) {
  const topic = session.topic
  const pendingUserMessageRef = useRef('')
  const abortControllerRef = useRef<AbortController | null>(null)
  const [chatError, setChatError] = useState<string | null>(null)
  const [streamingReply, setStreamingReply] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isWritingBack, setIsWritingBack] = useState(false)
  const displayMessages: LocalChatMessage[] = [
    ...session.messages,
    ...(streamingReply
      ? [
          {
            id: 'streaming-assistant',
            role: 'assistant' as const,
            content: streamingReply,
          },
        ]
      : []),
  ]

  const sendTopicMessage = async (value: string) => {
    const text = value.trim()
    if (!text || isLoading) return

    setChatError(null)
    pendingUserMessageRef.current = text
    appendTopicMessage(topic.id, 'user', text)
    onInputChange('')

    const abortController = new AbortController()
    abortControllerRef.current = abortController
    setIsLoading(true)
    setStreamingReply('')

    try {
      const assistantReply = await streamTopicReviewReply({
        topicId: topic.id,
        signal: abortController.signal,
        onChunk: (content) => {
          setStreamingReply(content)
        },
      })

      if (!assistantReply.trim()) return

      const savedMessage = appendTopicMessage(
        topic.id,
        'assistant',
        assistantReply,
      )
      setStreamingReply('')
      setIsWritingBack(true)
      void persistTopicWriteback({
        topicId: topic.id,
        userMessage: pendingUserMessageRef.current,
        assistantReply,
        assistantMessageId: savedMessage.id,
      })
        .catch(() => {
          setChatError('AI 已回复，但信号和草稿写回失败。')
        })
        .finally(() => {
          setIsWritingBack(false)
        })
    } catch (error) {
      if (isAbortError(error)) {
        setStreamingReply('')
      } else {
        setChatError('AI 回复失败，请检查 OpenAI API key 或模型配置后重试。')
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }

  const stop = () => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    setIsLoading(false)
    setStreamingReply('')
  }

  return (
    <Card className="h-full overflow-hidden rounded-[24px] border-slate-200/70 bg-white py-0 shadow-none">
      <CardContent className="flex min-h-0 flex-1 flex-col p-0">
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
          <MessageBubble
            role="assistant"
            content={`${topic.why_post}\n\n${topic.differentiation_angle}`}
          />
          {displayMessages.length > 0 ? (
            displayMessages.map((message) => (
              <MessageBubble
                key={message.id}
                role={message.role}
                content={message.content}
              />
            ))
          ) : (
            <div className="flex flex-col gap-3 pl-1">
              <p className="m-0 text-xs font-medium text-slate-400">
                选择一个问题开始讨论
              </p>
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((prompt) => (
                  <Button
                    key={prompt}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => void sendTopicMessage(prompt)}
                    disabled={isLoading}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        <form
          className="shrink-0 border-t border-slate-100 p-4"
          onSubmit={(event) => {
            event.preventDefault()
            void sendTopicMessage(inputValue)
          }}
        >
          <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-none">
            <Textarea
              value={inputValue}
              onChange={(event) => onInputChange(event.target.value)}
              placeholder="和 AI 讨论这个项目是否值得做、适合什么内容形式、需要哪些素材..."
              className="min-h-20 resize-none border-0 shadow-none focus-visible:ring-0"
              disabled={isLoading}
            />
            {chatError ? (
              <p className="m-0 px-2 text-sm text-destructive">{chatError}</p>
            ) : null}
            {isWritingBack ? (
              <p className="m-0 px-2 text-xs text-slate-500">
                正在沉淀信号和草稿...
              </p>
            ) : null}
            <div className="flex justify-end gap-2 pt-2">
              {isLoading ? (
                <Button type="button" variant="outline" size="sm" onClick={stop}>
                  停止
                </Button>
              ) : null}
              <Button
                type="submit"
                size="sm"
                disabled={isLoading || !inputValue.trim()}
              >
                {isLoading ? '回复中...' : '发送'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function MessageBubble({
  role,
  content,
}: {
  role: 'user' | 'assistant'
  content: string
}) {
  const isUser = role === 'user'

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[78%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-6',
          isUser
            ? 'bg-slate-950 text-white'
            : 'border border-slate-200 bg-slate-50 text-slate-700',
        )}
      >
        {content}
      </div>
    </div>
  )
}

async function persistTopicWriteback({
  topicId,
  userMessage,
  assistantReply,
  assistantMessageId,
}: {
  topicId: number
  userMessage: string
  assistantReply: string
  assistantMessageId: number
}) {
  const session = getTopicReviewSession(topicId)
  const response = await fetch('/api/topic-review/writeback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic: session.topic,
      messages: session.messages,
      preferences: getPreferences(),
      userMessage,
      assistantReply,
    }),
  })

  if (!response.ok) {
    throw new Error('Topic review writeback failed')
  }

  const writeback = (await response.json()) as TopicReviewWritebackResponse
  applyTopicReviewWriteback(topicId, {
    ...writeback,
    messageId: assistantMessageId,
  })
}

async function streamTopicReviewReply({
  topicId,
  signal,
  onChunk,
}: {
  topicId: number
  signal: AbortSignal
  onChunk: (content: string) => void
}) {
  const session = getTopicReviewSession(topicId)
  const response = await fetch('/api/topic-review/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      topic: session.topic,
      messages: session.messages,
      preferences: getPreferences(),
    }),
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response))
  }

  if (!response.body) {
    throw new Error('Topic review chat response did not include a stream')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let content = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    content += decoder.decode(value, { stream: true })
    onChunk(content)
  }

  content += decoder.decode()
  onChunk(content)

  return content
}

async function readErrorMessage(response: Response) {
  try {
    const body = (await response.json()) as { error?: string }
    return body.error || 'Topic review chat request failed'
  } catch {
    return 'Topic review chat request failed'
  }
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError'
}
