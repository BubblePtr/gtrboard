from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ScoringWeights:
    novelty_weight: float = 0.15
    utility_weight: float = 0.20
    local_ai_weight: float = 0.30
    doc_quality_weight: float = 0.10
    engagement_weight: float = 0.25


def score_topic(
    *,
    novelty: int,
    utility: int,
    local_ai: int,
    doc_quality: int,
    engagement_estimate: str,
    weights: ScoringWeights,
) -> float:
    engagement_map = {"high": 10, "medium": 6, "low": 3}
    engagement = engagement_map.get(engagement_estimate, 6)
    score = (
        novelty * weights.novelty_weight
        + utility * weights.utility_weight
        + local_ai * weights.local_ai_weight
        + doc_quality * weights.doc_quality_weight
        + engagement * weights.engagement_weight
    )
    return round(max(0.0, min(10.0, score)), 2)
