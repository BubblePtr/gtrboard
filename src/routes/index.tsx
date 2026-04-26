import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { fetchServerSentEvents, useChat } from '@tanstack/ai-react'
import type { UIMessage } from '@tanstack/ai-react'
import {
  Bot,
  ChartNoAxesColumnIncreasing,
  CircleCheck,
  Clock3,
  FileImage,
  GitBranch,
  MessageSquareText,
  Send,
  Sparkles,
  Square,
  ThumbsUp,
  TrendingUp,
} from 'lucide-react'
import { Streamdown } from 'streamdown'

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
import { Separator } from '#/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { Textarea } from '#/components/ui/textarea'
import { artifactIdeas, topicCandidates } from '#/data/topic-candidates'
import {
  recordFeedback,
  selectCandidate,
  setArtifactMode,
  workspaceStore,
} from '#/lib/workspace-store'

export const Route = createFileRoute('/')({
  component: GtrBoardWorkspace,
})

const promptTemplates = [
  '帮我判断这个项目适合做图文还是短视频，并给出内容钩子。',
  '把这个项目和同类 GitHub Trending 项目做一个差异化角度对比。',
  '生成一份封面图提示词、三段式脚本和风险说明。',
]

function GtrBoardWorkspace() {
  const selectedCandidateId = useStore(
    workspaceStore,
    (state) => state.selectedCandidateId,
  )
  const artifactMode = useStore(workspaceStore, (state) => state.artifactMode)
  const feedbackCount = useStore(workspaceStore, (state) => state.feedbackCount)
  const [input, setInput] = useState('')

  const selectedCandidate = useMemo(
    () =>
      topicCandidates.find((candidate) => candidate.id === selectedCandidateId) ??
      topicCandidates[0],
    [selectedCandidateId],
  )

  const { messages, sendMessage, isLoading, stop, error } = useChat({
    connection: fetchServerSentEvents('/api/chat'),
  })

  const sendPrompt = (value = input) => {
    const text = value.trim()
    if (!text) return

    sendMessage(
      `${text}\n\n当前候选项目：${selectedCandidate.name} (${selectedCandidate.repo})。\n摘要：${selectedCandidate.summary}\n推荐角度：${selectedCandidate.angle}`,
    )
    setInput('')
  }

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-4 py-4 sm:px-6">
      <section className="grid min-h-[calc(100vh-9rem)] gap-4 lg:grid-cols-[320px_minmax(0,1fr)_360px]">
        <aside className="flex min-h-0 flex-col gap-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Nightly discovery</CardTitle>
                  <CardDescription>
                    Python pipelines score GitHub Trending candidates.
                  </CardDescription>
                </div>
                <Badge variant="secondary">04:00 UTC</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <Metric label="Candidates" value="128" />
                <Metric label="Reviewed" value="34" />
                <Metric label="Queued" value="9" />
              </div>
              <Separator />
              <div className="flex flex-col gap-3">
                {topicCandidates.map((candidate) => {
                  const isSelected = candidate.id === selectedCandidate.id
                  return (
                    <button
                      key={candidate.id}
                      type="button"
                      onClick={() => selectCandidate(candidate.id)}
                      className={`rounded-md border p-3 text-left transition ${
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-card hover:bg-accent'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="m-0 truncate text-sm font-semibold">
                            {candidate.name}
                          </p>
                          <p
                            className={`m-0 truncate text-xs ${
                              isSelected
                                ? 'text-primary-foreground/75'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {candidate.repo}
                          </p>
                        </div>
                        <Badge variant={isSelected ? 'secondary' : 'outline'}>
                          {candidate.trendScore}
                        </Badge>
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-xs">
                        <TrendingUp aria-hidden="true" className="size-3" />
                        <span>{candidate.momentum}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </aside>

        <section className="flex min-h-0 flex-col gap-4">
          <Card className="min-h-0 flex-1">
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex flex-col gap-2">
                  <Badge className="w-fit" variant="outline">
                    Chat-first evaluation
                  </Badge>
                  <div>
                    <CardTitle className="text-2xl">
                      {selectedCandidate.name}
                    </CardTitle>
                    <CardDescription>
                      {selectedCandidate.repo} · {selectedCandidate.language} ·{' '}
                      {selectedCandidate.stars} stars
                    </CardDescription>
                  </div>
                </div>
                <div className="grid min-w-56 grid-cols-2 gap-2">
                  <ScoreCard label="Trend" value={selectedCandidate.trendScore} />
                  <ScoreCard label="Content fit" value={selectedCandidate.contentFit} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-col gap-4">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
                <div className="rounded-md border bg-muted/40 p-4">
                  <p className="m-0 text-sm leading-6">{selectedCandidate.summary}</p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {selectedCandidate.angle}
                  </p>
                </div>
                <div className="rounded-md border bg-card p-4">
                  <p className="m-0 flex items-center gap-2 text-sm font-semibold">
                    <Clock3 aria-hidden="true" className="size-4" />
                    scoring loop
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {feedbackCount} feedback events will be used by the next
                    nightly scoring job.
                  </p>
                  <Button className="mt-4 w-full" size="sm" onClick={recordFeedback}>
                    <ThumbsUp data-icon="inline-start" />
                    Mark useful
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {promptTemplates.map((template) => (
                  <Button
                    key={template}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => sendPrompt(template)}
                  >
                    <Sparkles data-icon="inline-start" />
                    {template}
                  </Button>
                ))}
              </div>

              <div className="min-h-[320px] flex-1 overflow-y-auto rounded-md border bg-background p-3">
                {messages.length === 0 ? (
                  <EmptyChat candidateName={selectedCandidate.name} />
                ) : (
                  <div className="flex flex-col gap-3">
                    {messages.map((message: UIMessage) => (
                      <ChatMessage key={message.id} message={message} />
                    ))}
                  </div>
                )}
              </div>

              {error ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {error.message}
                </div>
              ) : null}

              <form
                className="flex flex-col gap-2"
                onSubmit={(event) => {
                  event.preventDefault()
                  sendPrompt()
                }}
              >
                <Textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask about content angle, audience fit, risk, visuals, script structure, or scoring feedback..."
                  className="min-h-24 resize-none"
                />
                <div className="flex items-center justify-between gap-3">
                  <p className="m-0 text-xs text-muted-foreground">
                    Server-side keys only. Chat streams through TanStack AI SSE.
                  </p>
                  {isLoading ? (
                    <Button type="button" variant="destructive" onClick={stop}>
                      <Square data-icon="inline-start" />
                      Stop
                    </Button>
                  ) : (
                    <Button type="submit" disabled={!input.trim()}>
                      <Send data-icon="inline-start" />
                      Send
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </section>

        <aside className="flex min-h-0 flex-col gap-3">
          <Card>
            <CardHeader>
              <CardTitle>Artifact studio</CardTitle>
              <CardDescription>
                Plan visuals and media from the same evaluation context.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={artifactMode} onValueChange={setArtifactMode}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="chart">Chart</TabsTrigger>
                  <TabsTrigger value="image">Image</TabsTrigger>
                  <TabsTrigger value="media">Media</TabsTrigger>
                </TabsList>
                <TabsContent value="chart" className="mt-4">
                  <ArtifactPanel
                    icon={<ChartNoAxesColumnIncreasing className="size-5" />}
                    title="Trend radar"
                    body="Compare velocity, novelty, demo quality, and audience relevance before committing to a topic."
                  />
                </TabsContent>
                <TabsContent value="image" className="mt-4">
                  <ArtifactPanel
                    icon={<FileImage className="size-5" />}
                    title="Cover prompt"
                    body="Generate image prompts that show the repository's real workflow instead of abstract AI decoration."
                  />
                </TabsContent>
                <TabsContent value="media" className="mt-4">
                  <ArtifactPanel
                    icon={<MessageSquareText className="size-5" />}
                    title="Short script"
                    body="Turn research into a hook, proof segment, and practical takeaway for creator workflows."
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Why this topic might work</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {selectedCandidate.signals.map((signal) => (
                <div key={signal} className="flex items-start gap-2 text-sm">
                  <CircleCheck
                    aria-hidden="true"
                    className="mt-0.5 size-4 text-primary"
                  />
                  <span>{signal}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Review risks</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {selectedCandidate.risks.map((risk) => (
                <div key={risk} className="rounded-md border bg-muted/40 p-3 text-sm">
                  {risk}
                </div>
              ))}
              <Separator />
              <div className="flex flex-wrap gap-2">
                {artifactIdeas.map((idea) => (
                  <Badge key={idea} variant="secondary">
                    {idea}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </aside>
      </section>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/40 px-2 py-3">
      <p className="m-0 text-lg font-semibold">{value}</p>
      <p className="m-0 text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function ScoreCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-muted/40 p-3">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span>{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
      <Progress value={value} className="mt-2" />
    </div>
  )
}

function EmptyChat({ candidateName }: { candidateName: string }) {
  return (
    <div className="flex h-full min-h-[292px] flex-col items-center justify-center gap-3 text-center">
      <div className="flex size-12 items-center justify-center rounded-md border bg-muted">
        <Bot aria-hidden="true" className="size-6" />
      </div>
      <div>
        <p className="m-0 font-semibold">Discuss {candidateName}</p>
        <p className="m-0 max-w-md text-sm text-muted-foreground">
          Ask the AI to test the project angle, generate artifacts, or identify
          feedback signals for future scoring.
        </p>
      </div>
    </div>
  )
}

function ChatMessage({ message }: { message: UIMessage }) {
  const isAssistant = message.role === 'assistant'

  return (
    <article
      className={`flex gap-3 rounded-md border p-3 ${
        isAssistant ? 'bg-muted/40' : 'bg-card'
      }`}
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
        {isAssistant ? <Bot aria-hidden="true" className="size-4" /> : 'You'}
      </div>
      <div className="min-w-0 flex-1 text-sm leading-6">
        {message.parts.map((part, index) => {
          if (part.type === 'text' && part.content) {
            return (
              <div key={index} className="prose prose-sm max-w-none dark:prose-invert">
                <Streamdown>{part.content}</Streamdown>
              </div>
            )
          }

          return null
        })}
      </div>
    </article>
  )
}

function ArtifactPanel({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode
  title: string
  body: string
}) {
  return (
    <div className="rounded-md border bg-muted/40 p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-md bg-background">
          {icon}
        </div>
        <div>
          <p className="m-0 font-semibold">{title}</p>
          <p className="m-0 text-sm text-muted-foreground">Ready for queue</p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p>
      <div className="mt-4 flex items-center gap-2 rounded-md border bg-background p-3 text-sm">
        <GitBranch aria-hidden="true" className="size-4" />
        Python worker picks this up after human approval.
      </div>
    </div>
  )
}
