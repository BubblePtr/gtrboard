import { run } from '@openai/agents'
import { createFileRoute } from '@tanstack/react-router'

import {
  buildTopicReviewInput,
  createMissingOpenAIKeyResponse,
  createTopicReviewAgent,
  requireOpenAIKey,
  type TopicReviewChatRequest,
} from '#/lib/topic-review-agents.server'

export const Route = createFileRoute('/api/topic-review/chat')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          if (!requireOpenAIKey()) {
            return createMissingOpenAIKeyResponse()
          }

          const body = (await request.json()) as TopicReviewChatRequest
          const result = await run(
            createTopicReviewAgent(),
            buildTopicReviewInput(body),
            {
              stream: true,
              signal: request.signal,
            },
          )

          return new Response(result.toTextStream(), {
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'Cache-Control': 'no-cache',
            },
          })
        } catch (error) {
          if (request.signal.aborted || isAbortError(error)) {
            return new Response(null, { status: 499 })
          }

          return Response.json(
            { error: 'Topic review chat request failed' },
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
