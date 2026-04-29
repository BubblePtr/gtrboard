import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('#/lib/gtr-dashboard-store', () => ({
  applyPipelineResult: vi.fn(),
}))

const originalFetch = globalThis.fetch

describe('loadLatestPipelineResult', () => {
  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('throws a clear error when the API response is missing artifact data', async () => {
    globalThis.fetch = vi.fn(async () =>
      Response.json({ config: { languages: [], limit: 1, source: 'legacy', model: 'm' } }),
    ) as typeof fetch

    const { loadLatestPipelineResult } = await import('./pipeline-client')

    await expect(
      loadLatestPipelineResult({
        languages: [''],
        limit: 1,
        top_n: 1,
        source: 'legacy',
        model: 'qwen3.6-max-preview',
      }),
    ).rejects.toThrow('Pipeline run returned invalid payload')
  })
})
