from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class RawProject:
    github_url: str
    name: str
    owner: str
    language: str = ""
    stars: int = 0
    description: str = ""
    readme_text: str | None = None
    collected_at: str = field(default_factory=utc_now)


@dataclass
class ProjectProfile:
    project: RawProject
    novelty_score: int
    utility_score: int
    doc_quality_score: int
    local_ai_relevance: int
    tags: list[str]
    summary: str
    analysis_status: str = "complete"
    analysis_reason: str | None = None
    analyzed_at: str = field(default_factory=utc_now)


@dataclass
class TopicSuggestion:
    profile: ProjectProfile
    why_post: str
    differentiation_angle: str
    target_audience: str
    engagement_estimate: str
    draft_tweet: str
    draft_script: str
    draft_outline: str
    generation_status: str = "complete"
    generation_reason: str | None = None
    final_score: float | None = None
    created_at: str = field(default_factory=utc_now)


@dataclass
class CuratedTopic:
    topic: TopicSuggestion
    rank: int
    final_score: float
    selection_reason: str
    project_name: str
    github_url: str


@dataclass
class DailyReport:
    topics: list[CuratedTopic]
    report_summary: str
    total_analyzed: int
    total_selected: int


@dataclass
class PipelineStage:
    name: str
    status: str
    progress: int
    message: str | None = None
    started_at: str = field(default_factory=utc_now)
    finished_at: str | None = None


@dataclass
class PipelineResult:
    status: str
    projects_collected: int
    projects_analyzed: int
    topics_generated: int
    report: DailyReport
    report_path: Path
    stages: list[PipelineStage]
    error_log: str | None = None
    started_at: str = field(default_factory=utc_now)
    finished_at: str | None = None

    def to_json_dict(self) -> dict:
        return {
            "status": self.status,
            "projects_collected": self.projects_collected,
            "projects_analyzed": self.projects_analyzed,
            "topics_generated": self.topics_generated,
            "report_path": str(self.report_path),
            "error_log": self.error_log,
            "started_at": self.started_at,
            "finished_at": self.finished_at,
            "stages": [asdict(stage) for stage in self.stages],
            "topics": [
                {
                    "rank": item.rank,
                    "final_score": item.final_score,
                    "selection_reason": item.selection_reason,
                    "project_name": item.project_name,
                    "github_url": item.github_url,
                    "language": item.topic.profile.project.language,
                    "stars": item.topic.profile.project.stars,
                    "why_post": item.topic.why_post,
                    "differentiation_angle": item.topic.differentiation_angle,
                    "target_audience": item.topic.target_audience,
                    "engagement_estimate": item.topic.engagement_estimate,
                    "draft_tweet": item.topic.draft_tweet,
                    "draft_script": item.topic.draft_script,
                    "draft_outline": item.topic.draft_outline,
                    "tags": item.topic.profile.tags,
                    "analysis_status": item.topic.profile.analysis_status,
                    "analysis_reason": item.topic.profile.analysis_reason,
                    "generation_status": item.topic.generation_status,
                    "generation_reason": item.topic.generation_reason,
                }
                for item in self.report.topics
            ],
        }
