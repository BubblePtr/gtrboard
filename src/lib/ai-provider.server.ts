import { anthropicText } from '@tanstack/ai-anthropic'
import { geminiText } from '@tanstack/ai-gemini'
import { ollamaText } from '@tanstack/ai-ollama'
import { openaiText } from '@tanstack/ai-openai'

import { loadLocalEnv } from '#/lib/local-env.server'

export function getTextAdapter() {
  loadLocalEnv()

  if (process.env.ANTHROPIC_API_KEY) {
    return anthropicText(process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5')
  }

  if (process.env.OPENAI_API_KEY) {
    return openaiText(process.env.OPENAI_MODEL || 'qwen3.6-max-preview')
  }

  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
    return geminiText(process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp')
  }

  return ollamaText(process.env.OLLAMA_MODEL || 'mistral:7b')
}
