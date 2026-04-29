import { afterEach, describe, expect, it, vi } from 'vitest'

const providerMocks = vi.hoisted(() => ({
  anthropicText: vi.fn((model: string) => ({ provider: 'anthropic', model })),
  geminiText: vi.fn((model: string) => ({ provider: 'gemini', model })),
  ollamaText: vi.fn((model: string) => ({ provider: 'ollama', model })),
  openaiText: vi.fn((model: string, config?: Record<string, unknown>) => ({
    provider: 'openai',
    model,
    config,
  })),
}))

vi.mock('@tanstack/ai-anthropic', () => ({
  anthropicText: providerMocks.anthropicText,
}))
vi.mock('@tanstack/ai-gemini', () => ({
  geminiText: providerMocks.geminiText,
}))
vi.mock('@tanstack/ai-ollama', () => ({
  ollamaText: providerMocks.ollamaText,
}))
vi.mock('@tanstack/ai-openai', () => ({
  openaiText: providerMocks.openaiText,
}))
vi.mock('#/lib/local-env.server', () => ({
  loadLocalEnv: vi.fn(),
}))

const originalEnv = { ...process.env }

describe('getTextAdapter', () => {
  afterEach(() => {
    process.env = { ...originalEnv }
    vi.clearAllMocks()
  })

  it('passes OPENAI_BASE_URL to the OpenAI-compatible adapter', async () => {
    process.env = {
      ...originalEnv,
      ANTHROPIC_API_KEY: '',
      GEMINI_API_KEY: '',
      GOOGLE_API_KEY: '',
      OPENAI_API_KEY: 'test-key',
      OPENAI_BASE_URL: 'https://dashscope.example/v1',
      OPENAI_MODEL: 'qwen3.6-max-preview',
    }

    const { getTextAdapter } = await import('./ai-provider.server')
    getTextAdapter()

    expect(providerMocks.openaiText).toHaveBeenCalledWith(
      'qwen3.6-max-preview',
      { baseURL: 'https://dashscope.example/v1' },
    )
  })
})
