import { Store } from '@tanstack/store'

import { topicCandidates } from '#/data/topic-candidates'

export const workspaceStore = new Store({
  selectedCandidateId: topicCandidates[0].id,
  artifactMode: 'chart',
  feedbackCount: 12,
})

export const selectCandidate = (candidateId: string) => {
  workspaceStore.setState((state) => ({
    ...state,
    selectedCandidateId: candidateId,
  }))
}

export const setArtifactMode = (artifactMode: string) => {
  workspaceStore.setState((state) => ({
    ...state,
    artifactMode,
  }))
}

export const recordFeedback = () => {
  workspaceStore.setState((state) => ({
    ...state,
    feedbackCount: state.feedbackCount + 1,
  }))
}
