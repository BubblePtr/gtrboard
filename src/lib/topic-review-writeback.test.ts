import { describe, expect, it } from 'vitest'

import { normalizeTopicReviewWriteback } from './topic-review-writeback'

describe('normalizeTopicReviewWriteback', () => {
  it('keeps valid signals and normalizes strength to the client range', () => {
    const result = normalizeTopicReviewWriteback({
      signals: [
        {
          signal_type: 'preference',
          label: '短视频开场',
          polarity: 'positive',
          strength: 1,
        },
        {
          signal_type: 'concern',
          label: '受众过窄',
          polarity: 'negative',
          strength: 5,
        },
      ],
      draftUpdates: {
        tweet: '新的推文草稿',
        script: '   ',
        outline: '新的大纲',
      },
      summary: '提取完成',
    })

    expect(result.signals).toEqual([
      {
        signal_type: 'preference',
        label: '短视频开场',
        polarity: 'positive',
        strength: 0.2,
      },
      {
        signal_type: 'concern',
        label: '受众过窄',
        polarity: 'negative',
        strength: 1,
      },
    ])
    expect(result.draftUpdates).toEqual({
      tweet: '新的推文草稿',
      outline: '新的大纲',
    })
    expect(result.summary).toBe('提取完成')
  })

  it('returns empty updates for empty model output', () => {
    const result = normalizeTopicReviewWriteback({
      signals: [],
      draftUpdates: {
        tweet: '',
      },
    })

    expect(result).toEqual({
      signals: [],
      draftUpdates: {},
    })
  })
})
