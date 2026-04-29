import { run } from '@openai/agents'
import { createFileRoute } from '@tanstack/react-router'

import {
  buildTopicWritebackInput,
  createMissingOpenAIKeyResponse,
  createTopicWritebackAgent,
  requireOpenAIKey,
  type TopicReviewWritebackRequest,
} from '#/lib/topic-review-agents.server'
import {
  normalizeTopicReviewWriteback,
} from '#/lib/topic-review-writeback'

export const Route = createFileRoute('/api/topic-review/writeback')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          if (!requireOpenAIKey()) {
            return createMissingOpenAIKeyResponse()
          }

          const body = (await request.json()) as TopicReviewWritebackRequest
          const result = await run(
            createTopicWritebackAgent(),
            buildTopicWritebackInput(body),
            { signal: request.signal },
          )

          return Response.json(normalizeTopicReviewWriteback(result.finalOutput))
        } catch (error) {
          if (request.signal.aborted || isAbortError(error)) {
            return new Response(null, { status: 499 })
          }

          return Response.json(
            { error: 'Topic review writeback failed' },
            { status: 500 },
          )
        }
      },
    },
  },
})

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError'
}
