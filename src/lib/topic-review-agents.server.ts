import { Agent, setOpenAIAPI } from '@openai/agents'

import type {
  Preference,
  ReviewMessage,
  Topic,
} from '#/lib/gtr-dashboard-types'
import { loadLocalEnv } from '#/lib/local-env.server'
import { topicReviewWritebackSchema } from '#/lib/topic-review-writeback'

export type TopicReviewChatRequest = {
  topic?: Topic
  messages?: ReviewMessage[]
  preferences?: Preference
}

export type TopicReviewWritebackRequest = {
  topic: Topic
  messages: ReviewMessage[]
  preferences: Preference
  userMessage: string
  assistantReply: string
}

const DEFAULT_AGENT_MODEL = 'qwen3.6-max-preview'

export function configureOpenAICompatibleAgents() {
  loadLocalEnv()
  setOpenAIAPI('chat_completions')
}

export function getOpenAIModel() {
  configureOpenAICompatibleAgents()
  return process.env.OPENAI_MODEL || DEFAULT_AGENT_MODEL
}

export function requireOpenAIKey() {
  configureOpenAICompatibleAgents()
  return Boolean(process.env.OPENAI_API_KEY)
}

export function createMissingOpenAIKeyResponse() {
  return Response.json(
    { error: 'OPENAI_API_KEY is required for topic review agents' },
    { status: 500 },
  )
}

export function createTopicReviewAgent() {
  return new Agent({
    name: 'GTR-Board Topic Review Agent',
    model: getOpenAIModel(),
    instructions: `You are GTR-Board's topic review agent.

Goal:
- Help a Chinese technical creator decide whether a GitHub Trending project is worth turning into content.
- Be concrete about audience, angle, risks, scripts, and draft artifacts.
- Do not approve or skip topics yourself. The user makes the final decision.

Style:
- Reply in Chinese.
- Keep the answer concise and operational.
- When useful, suggest updates to tweet, script, or outline, but do not wrap them as JSON in this streaming reply.`,
  })
}

export function createTopicWritebackAgent() {
  return new Agent({
    name: 'GTR-Board Topic Review Writeback Extractor',
    model: getOpenAIModel(),
    outputType: topicReviewWritebackSchema,
    instructions: `You extract structured review writeback for GTR-Board.

Return only structured data that matches the schema.

Rules:
- signals should capture user preferences, concerns, requirements, adoption reasons, or rejection reasons.
- label must be short Chinese text.
- strength is 1-5 where 5 is strongest.
- draftUpdates should only include fields that materially improve the topic artifacts.
- Do not approve or skip the topic.`,
  })
}

export function buildTopicReviewInput(body: TopicReviewChatRequest) {
  return JSON.stringify(
    {
      creatorPositioning:
        body.preferences?.positioning ||
        '面向中文开发者，解释 AI 工具和开源项目的真实可用性',
      topic: body.topic ?? null,
      messages: body.messages ?? [],
    },
    null,
    2,
  )
}

export function buildTopicWritebackInput(body: TopicReviewWritebackRequest) {
  return JSON.stringify(
    {
      topic: body.topic,
      preferences: body.preferences,
      messages: body.messages,
      userMessage: body.userMessage,
      assistantReply: body.assistantReply,
    },
    null,
    2,
  )
}
