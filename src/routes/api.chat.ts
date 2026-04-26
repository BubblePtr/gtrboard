import { chat, toServerSentEventsResponse } from '@tanstack/ai'
import { anthropicText } from '@tanstack/ai-anthropic'
import { geminiText } from '@tanstack/ai-gemini'
import { ollamaText } from '@tanstack/ai-ollama'
import { openaiText } from '@tanstack/ai-openai'
import { createFileRoute } from '@tanstack/react-router'

const SYSTEM_PROMPT = `You are GTR-Board's topic research copilot.

The product is a chat-first AI workspace for discovering and evaluating GitHub Trending projects as content topics.
Help the user compare candidate repositories, find content angles, identify risks, propose artifacts such as charts, cover-image prompts, and media outlines, and explain what feedback should improve future scoring.

Keep repository secrets and provider keys server-side. If asked about automation, distinguish the interactive TanStack Start product from Python background services for nightly discovery, research, scoring, and long-running generation jobs.`

const getAdapter = () => {
  if (process.env.ANTHROPIC_API_KEY) {
    return anthropicText(process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5')
  }

  if (process.env.OPENAI_API_KEY) {
    return openaiText(process.env.OPENAI_MODEL || 'gpt-4o')
  }

  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
    return geminiText(process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp')
  }

  return ollamaText(process.env.OLLAMA_MODEL || 'mistral:7b')
}

export const Route = createFileRoute('/api/chat')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const abortController = new AbortController()

        try {
          const body = await request.json()
          const { messages } = body

          const stream = chat({
            adapter: getAdapter(),
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
