import { z } from 'zod'

const signalTypeSchema = z.enum([
  'preference',
  'concern',
  'requirement',
  'adoption_reason',
  'rejection_reason',
])

const signalPolaritySchema = z.enum(['positive', 'negative', 'neutral'])

const rawReviewSignalSchema = z.object({
  signal_type: signalTypeSchema,
  label: z.string().min(1).max(48),
  polarity: signalPolaritySchema,
  strength: z.number().min(1).max(5),
})

const draftUpdatesSchema = z
  .object({
    tweet: z.string().optional(),
    script: z.string().optional(),
    outline: z.string().optional(),
  })
  .optional()

export const topicReviewWritebackSchema = z.object({
  signals: z.array(rawReviewSignalSchema).default([]),
  draftUpdates: draftUpdatesSchema,
  summary: z.string().min(1).max(240).optional(),
})

export type TopicReviewWritebackModelOutput = z.input<
  typeof topicReviewWritebackSchema
>

export type TopicReviewWritebackResponse = {
  signals: Array<{
    signal_type: z.infer<typeof signalTypeSchema>
    label: string
    polarity: z.infer<typeof signalPolaritySchema>
    strength: number
  }>
  draftUpdates: {
    tweet?: string
    script?: string
    outline?: string
  }
  summary?: string
}

export function normalizeTopicReviewWriteback(
  input: TopicReviewWritebackModelOutput,
): TopicReviewWritebackResponse {
  const parsed = topicReviewWritebackSchema.parse(input)
  const draftUpdates = compactDraftUpdates(parsed.draftUpdates)

  return {
    signals: parsed.signals.map((signal) => ({
      ...signal,
      strength: Number((signal.strength / 5).toFixed(2)),
    })),
    draftUpdates,
    ...(parsed.summary ? { summary: parsed.summary } : {}),
  }
}

function compactDraftUpdates(
  draftUpdates: z.infer<typeof draftUpdatesSchema>,
): TopicReviewWritebackResponse['draftUpdates'] {
  if (!draftUpdates) return {}

  return Object.fromEntries(
    Object.entries(draftUpdates)
      .map(([key, value]) => [key, value?.trim()])
      .filter(([, value]) => Boolean(value)),
  ) as TopicReviewWritebackResponse['draftUpdates']
}
