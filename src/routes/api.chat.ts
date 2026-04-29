import { chat, toServerSentEventsResponse } from '@tanstack/ai'
import { createFileRoute } from '@tanstack/react-router'

import { getTextAdapter } from '#/lib/ai-provider.server'

const SYSTEM_PROMPT = `You are GTR-Board's topic research copilot.

The product is a chat-first AI workspace for discovering and evaluating GitHub Trending projects as content topics.
Help the user compare candidate repositories, find content angles, identify risks, propose artifacts such as charts, cover-image prompts, and media outlines, and explain what feedback should improve future scoring.

Keep repository secrets and provider keys server-side. If asked about automation, distinguish the interactive TanStack Start product from Python background services for nightly discovery, research, scoring, and long-running generation jobs.`

export const Route = createFileRoute('/api/chat')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const abortController = new AbortController()

        try {
          const body = await request.json()
          const { messages } = body

          const stream = chat({
            adapter: getTextAdapter(),
            messages,
            systemPrompts: [SYSTEM_PROMPT],
            abortController,
          })

          return toServerSentEventsResponse(stream, { abortController })
        } catch {
          if (abortController.signal.aborted) {
            return new Response(null, { status: 499 })
          }

          return Response.json(
            { error: 'GTR-Board chat request failed' },
            { status: 500 },
          )
        }
      },
    },
  },
})
