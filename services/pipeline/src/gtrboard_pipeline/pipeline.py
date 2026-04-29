from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal, Protocol

from gtrboard_pipeline.llm_client import DEFAULT_MODEL
from gtrboard_pipeline.collectors import FixtureCollector, LegacyTrendingCollector
from gtrboard_pipeline.llm_profile_scorer import OpenAICompatibleProfileScorer
from gtrboard_pipeline.llm_strategist import OpenAICompatibleStrategist
from gtrboard_pipeline.models import (
    CuratedTopic,
    DailyReport,
    PipelineResult,
    PipelineStage,
    ProjectProfile,
    RawProject,
    TopicSuggestion,
    utc_now,
)
from gtrboard_pipeline.scoring import ScoringWeights, score_topic

PipelineSource = Literal["fixtures", "legacy"]


class ProfileScorer(Protocol):
    async def analyze(
        self,
        project: RawProject,
        fallback_profile: ProjectProfile,
    ) -> ProjectProfile: ...


class Strategist(Protocol):
    async def generate(
        self,
        profile: ProjectProfile,
        fallback_topic: TopicSuggestion,
    ) -> TopicSuggestion: ...


@dataclass(frozen=True)
class PipelineConfig:
    languages: list[str] | None = None
    limit: int = 10
    top_n: int = 5
    source: PipelineSource = "fixtures"
    output_dir: Path = Path("reports")
    positioning: str = "本地AI实战派"
    model: str = DEFAULT_MODEL

    def __post_init__(self) -> None:
        if self.source not in {"fixtures", "legacy"}:
            raise ValueError(f"Unknown source: {self.source}. Use fixtures/legacy")
        if self.limit < 1:
            raise ValueError("limit must be >= 1")
        if self.top_n < 1:
            raise ValueError("top_n must be >= 1")

    @property
    def normalized_languages(self) -> list[str]:
        return self.languages if self.languages is not None else [""]


class PipelineOrchestrator:
    def __init__(
        self,
        config: PipelineConfig | None = None,
        profile_scorer: ProfileScorer | None = None,
        strategist: Strategist | None = None,
    ) -> None:
        self.config = config or PipelineConfig()
        self.weights = ScoringWeights()
        self.profile_scorer = profile_scorer or OpenAICompatibleProfileScorer(
            model=self.config.model,
            positioning=self.config.positioning,
        )
        self.strategist = strategist or OpenAICompatibleStrategist(
            model=self.config.model,
            positioning=self.config.positioning,
        )

    async def run(self) -> PipelineResult:
        started_at = utc_now()
        stages: list[PipelineStage] = []
        output_dir = self.config.output_dir
        output_dir.mkdir(parents=True, exist_ok=True)

        try:
            projects = await self._tracked_stage(stages, "collect", self._stage_collect)
            profiles = await self._tracked_stage(
                stages,
                "profile",
                lambda: self._stage_profile(projects),
            )
            topics = await self._tracked_stage(
                stages,
                "strategize",
                lambda: self._stage_strategize(profiles),
            )
            report = await self._tracked_stage(
                stages,
                "curate",
                lambda: self._stage_curate(topics),
            )
            report_path = await self._tracked_stage(
                stages,
                "report",
                lambda: self._write_report(report, output_dir),
            )

            result = PipelineResult(
                status="success",
                projects_collected=len(projects),
                projects_analyzed=len(profiles),
                topics_generated=len(topics),
                report=report,
                report_path=report_path,
                stages=stages,
                started_at=started_at,
                finished_at=utc_now(),
            )
            self._write_artifact(result, output_dir)
            return result
        except Exception as error:
            report = DailyReport(
                topics=[],
                report_summary="Pipeline failed before report generation.",
                total_analyzed=0,
                total_selected=0,
            )
            result = PipelineResult(
                status="failed",
                projects_collected=0,
                projects_analyzed=0,
                topics_generated=0,
                report=report,
                report_path=output_dir / "daily_report_failed.md",
                stages=stages,
                error_log=str(error),
                started_at=started_at,
                finished_at=utc_now(),
            )
            self._write_artifact(result, output_dir)
            raise

    async def _tracked_stage(self, stages: list[PipelineStage], name: str, fn):
        stage = PipelineStage(name=name, status="running", progress=0)
        stages.append(stage)
        try:
            result = await fn()
            stage.status = "complete"
            stage.progress = 100
            stage.finished_at = utc_now()
            return result
        except Exception as error:
            stage.status = "failed"
            stage.message = str(error)
            stage.finished_at = utc_now()
            raise

    async def _stage_collect(self) -> list[RawProject]:
        if self.config.source == "fixtures":
            collector = FixtureCollector(self.config.normalized_languages, self.config.limit)
        else:
            collector = LegacyTrendingCollector(
                self.config.normalized_languages,
                self.config.limit,
            )

        projects = await collector.collect()
        if not projects:
            raise RuntimeError("No projects collected")
        return projects[: self.config.limit]

    async def _stage_profile(self, projects: list[RawProject]) -> list[ProjectProfile]:
        profiles: list[ProjectProfile] = []
        for project in projects:
            fallback_profile = self._profile_project(project)
            profile = await self.profile_scorer.analyze(project, fallback_profile)
            profiles.append(profile)
        return profiles

    async def _stage_strategize(
        self,
        profiles: list[ProjectProfile],
    ) -> list[TopicSuggestion]:
        topics: list[TopicSuggestion] = []
        for profile in profiles:
            fallback_topic = self._topic_for_profile(profile)
            topic = await self.strategist.generate(profile, fallback_topic)
            topics.append(topic)
        return topics

    async def _stage_curate(self, topics: list[TopicSuggestion]) -> DailyReport:
        curated: list[CuratedTopic] = []
        for topic in topics:
            profile = topic.profile
            final_score = score_topic(
                novelty=profile.novelty_score,
                utility=profile.utility_score,
                local_ai=profile.local_ai_relevance,
                doc_quality=profile.doc_quality_score,
                engagement_estimate=topic.engagement_estimate,
                weights=self.weights,
            )
            topic.final_score = final_score
            curated.append(
                CuratedTopic(
                    topic=topic,
                    rank=0,
                    final_score=final_score,
                    selection_reason=self._selection_reason(profile, topic),
                    project_name=f"{profile.project.owner}/{profile.project.name}",
                    github_url=profile.project.github_url,
                )
            )

        curated.sort(key=lambda item: item.final_score, reverse=True)
        selected = curated[: self.config.top_n]
        for index, item in enumerate(selected, start=1):
            item.rank = index

        high_count = len([item for item in curated if item.final_score >= 7])
        summary = (
            f"从 {len(topics)} 个分析项目中选出 {len(selected)} 个选题。"
            f"高潜力选题（分数>=7）：{high_count} 个。"
        )
        if selected:
            summary += f" 今日最佳：{selected[0].project_name}。"

        return DailyReport(
            topics=selected,
            report_summary=summary,
            total_analyzed=len(topics),
            total_selected=len(selected),
        )

    async def _write_report(self, report: DailyReport, output_dir: Path) -> Path:
        date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        report_path = output_dir / f"daily_report_{date_str}.md"
        lines = [
            f"# GitHub Trending 每日选题报告 — {date_str}",
            "",
            f"> {report.report_summary}",
            "",
            f"- **分析项目总数：** {report.total_analyzed}",
            f"- **入选选题：** {report.total_selected}",
            "",
            "---",
            "",
        ]

        for item in report.topics:
            topic = item.topic
            lines.extend(
                [
                    f"## 第{item.rank}名 评分：{item.final_score} — {item.project_name}",
                    "",
                    f"**仓库地址：** {item.github_url}",
                    "",
                    f"**选题理由：** {topic.why_post}",
                    "",
                    f"**差异化角度：** {topic.differentiation_angle}",
                    "",
                    f"**目标受众：** {topic.target_audience}",
                    "",
                    f"**互动预估：** {topic.engagement_estimate}",
                    "",
                    f"**入选原因：** {item.selection_reason}",
                    "",
                    "### 推文草稿",
                    "",
                    topic.draft_tweet,
                    "",
                    "### 视频脚本草稿",
                    "",
                    topic.draft_script,
                    "",
                    "### 文章大纲",
                    "",
                    topic.draft_outline,
                    "",
                    "---",
                    "",
                ]
            )

        report_path.write_text("\n".join(lines), encoding="utf-8")
        return report_path

    def _profile_project(self, project: RawProject) -> ProjectProfile:
        text = f"{project.name} {project.description}".lower()
        stars = project.stars

        novelty = _clamp_score(5 + (2 if stars >= 30_000 else 1 if stars >= 10_000 else 0))
        utility = _clamp_score(
            5
            + (
                2
                if _contains_any(
                    text,
                    ["tool", "workflow", "server", "database", "automation"],
                )
                else 0
            )
        )
        doc_quality = _clamp_score(5 + (1 if project.description else -1))
        local_ai = _clamp_score(
            5
            + (
                3
                if _contains_any(text, ["llm", "local", "ai", "agent", "inference"])
                else 0
            )
            + (1 if project.language.lower() in {"python", "c++", "typescript"} else 0)
        )
        tags = self._tags_for(project, text)
        summary = f"{project.owner}/{project.name}：{project.description or '暂无描述'}"

        return ProjectProfile(
            project=project,
            novelty_score=novelty,
            utility_score=utility,
            doc_quality_score=doc_quality,
            local_ai_relevance=local_ai,
            tags=tags,
            summary=summary,
        )

    def _topic_for_profile(self, profile: ProjectProfile) -> TopicSuggestion:
        project = profile.project
        name = f"{project.owner}/{project.name}"
        local_angle = "本地 AI" if profile.local_ai_relevance >= 8 else "开发者工具"
        engagement = (
            "high"
            if profile.local_ai_relevance >= 8 or profile.novelty_score >= 7
            else "medium"
        )

        return TopicSuggestion(
            profile=profile,
            why_post=(
                f"{name} 正在 GitHub Trending 中体现 {local_angle} 的新实践，"
                "适合转成可讨论的技术选题。"
            ),
            differentiation_angle=(
                f"不做泛泛项目介绍，聚焦 {self.config.positioning} "
                "视角下的真实使用边界、落地成本和可演示场景。"
            ),
            target_audience="关注 AI 工具、开源项目和工程效率的技术创作者与开发者",
            engagement_estimate=engagement,
            draft_tweet=(
                f"{name} 值得关注：{project.description or profile.summary} "
                "与其追热点，不如拆它解决了哪个真实工作流问题。"
            ),
            draft_script=(
                "开场：用一个具体使用场景引出项目。"
                "中段：拆解能力、限制和部署成本。"
                "结尾：给出适合哪些团队尝试的判断标准。"
            ),
            draft_outline=(
                "1. Trending 背景\n"
                "2. 项目解决的问题\n"
                "3. 可演示亮点\n"
                "4. 风险与适用边界"
            ),
        )

    def _selection_reason(self, profile: ProjectProfile, topic: TopicSuggestion) -> str:
        if profile.local_ai_relevance >= 8:
            return "契合本地 AI 和 agent 选题定位"
        if topic.engagement_estimate == "high":
            return "具备较高讨论潜力"
        if profile.utility_score >= 7:
            return "实用性明确，适合做方法论拆解"
        return "综合评分平衡"

    def _tags_for(self, project: RawProject, text: str) -> list[str]:
        tags = [project.language] if project.language else []
        if _contains_any(text, ["llm", "ai", "agent", "inference"]):
            tags.append("AI")
        if _contains_any(text, ["workflow", "automation", "browser"]):
            tags.append("Workflow")
        if _contains_any(text, ["database", "postgres", "vector"]):
            tags.append("Data")
        return list(dict.fromkeys(tags)) or ["Open Source"]

    def _write_artifact(self, result: PipelineResult, output_dir: Path) -> None:
        artifact_path = output_dir / "latest_pipeline_run.json"
        artifact_path.write_text(
            json.dumps(result.to_json_dict(), ensure_ascii=False, indent=2),
            encoding="utf-8",
        )


def _contains_any(text: str, keywords: list[str]) -> bool:
    return any(keyword in text for keyword in keywords)


def _clamp_score(value: int) -> int:
    return max(1, min(10, value))
