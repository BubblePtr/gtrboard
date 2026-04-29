import { afterEach, describe, expect, it } from 'vitest'

import {
  createMissingOpenAIKeyResponse,
  createTopicWritebackAgent,
  getOpenAIModel,
  requireOpenAIKey,
} from './topic-review-agents.server'
import { topicReviewWritebackSchema } from './topic-review-writeback'

const originalOpenAiKey = process.env.OPENAI_API_KEY
const originalOpenAiModel = process.env.OPENAI_MODEL

describe('topic-review-agents server helpers', () => {
  afterEach(() => {
    process.env.OPENAI_API_KEY = originalOpenAiKey
    process.env.OPENAI_MODEL = originalOpenAiModel
  })

  it('uses OPENAI_MODEL when present and falls back to gpt-4o', () => {
    delete process.env.OPENAI_MODEL

    expect(getOpenAIModel()).toBe('gpt-4o')

    process.env.OPENAI_MODEL = 'gpt-4.1-mini'

    expect(getOpenAIModel()).toBe('gpt-4.1-mini')
  })

  it('reports a missing OPENAI_API_KEY before creating topic review runs', async () => {
    delete process.env.OPENAI_API_KEY

    expect(requireOpenAIKey()).toBe(false)

    const response = createMissingOpenAIKeyResponse()

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      error: 'OPENAI_API_KEY is required for topic review agents',
    })
  })

  it('creates a writeback agent bound to the shared Zod schema', () => {
    process.env.OPENAI_API_KEY = 'test-key'

    const agent = createTopicWritebackAgent()

    expect(agent.outputType).toBe(topicReviewWritebackSchema)
  })
})
