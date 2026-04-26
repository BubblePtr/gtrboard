import { describe, expect, it } from 'vitest'

import { topicCandidates } from '#/data/topic-candidates'
import {
  recordFeedback,
  selectCandidate,
  setArtifactMode,
  workspaceStore,
} from './workspace-store'

describe('workspaceStore', () => {
  it('tracks topic selection, artifact mode, and feedback count', () => {
    const secondCandidate = topicCandidates[1]
    const initialFeedbackCount = workspaceStore.state.feedbackCount

    selectCandidate(secondCandidate.id)
    setArtifactMode('media')
    recordFeedback()

    expect(workspaceStore.state.selectedCandidateId).toBe(secondCandidate.id)
    expect(workspaceStore.state.artifactMode).toBe('media')
    expect(workspaceStore.state.feedbackCount).toBe(initialFeedbackCount + 1)
  })
})
