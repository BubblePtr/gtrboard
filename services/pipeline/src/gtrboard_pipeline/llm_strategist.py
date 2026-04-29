from __future__ import annotations

import asyncio
from dataclasses import replace
from typing import Any

from gtrboard_pipeline.llm_client import (
    MissingAPIKeyError,
    OpenAICompatibleChatClient,
)
from gtrboard_pipeline.models import ProjectProfile, TopicSuggestion


class OpenAICompatibleStrategist:
    def __init__(
        self,
        *,
        model: str | None = None,
        positioning: str = "本地AI实战派",
        timeout: float = 120.0,
    ) -> None:
        self.client = OpenAICompatibleChatClient(model=model, timeout=timeout)
        self.positioning = positioning

    async def generate(
        self,
        profile: ProjectProfile,
        fallback_topic: TopicSuggestion,
    ) -> TopicSuggestion:
        try:
            output = await asyncio.to_thread(
                self.client.complete_json,
                system_prompt=(
                    "You are a Chinese technical content strategist. Generate "
                    "practical topic material from a GitHub project profile. "
                    "Return only valid JSON."
                ),
                user_payload=self._build_payload(profile),
                temperature=0.35,
            )
            return TopicSuggestion(
                profile=profile,
                why_post=_text(output.get("why_post"), fallback_topic.why_post),
                differentiation_angle=_text(
                    output.get("differentiation_angle"),
                    fallback_topic.differentiation_angle,
                ),
                target_audience=_text(
                    output.get("target_audience"),
                    fallback_topic.target_audience,
                ),
                engagement_estimate=_engagement(
                    output.get("engagement_estimate"),
                    fallback_topic.engagement_estimate,
                ),
                draft_tweet=_text(output.get("draft_tweet"), fallback_topic.draft_tweet),
                draft_script=_text(
                    output.get("draft_script"),
                    fallback_topic.draft_script,
                ),
                draft_outline=_text(
                    output.get("draft_outline"),
                    fallback_topic.draft_outline,
                ),
                generation_status="complete",
            )
        except MissingAPIKeyError as error:
            return self._degraded(fallback_topic, str(error))
        except Exception as error:
            return self._degraded(fallback_topic, f"LLM generation failed: {error}")

    def _build_payload(self, profile: ProjectProfile) -> dict[str, Any]:
        project = profile.project
        return {
            "positioning": self.positioning,
            "repository": {
                "name": f"{project.owner}/{project.name}",
                "url": project.github_url,
                "language": project.language,
                "stars": project.stars,
                "description": project.description,
            },
            "profile": {
                "summary": profile.summary,
                "tags": profile.tags,
                "novelty_score": profile.novelty_score,
                "utility_score": profile.utility_score,
                "doc_quality_score": profile.doc_quality_score,
                "local_ai_relevance": profile.local_ai_relevance,
            },
            "instructions": (
                "Create a content topic for a Chinese audience. Avoid generic "
                "project introduction. Focus on concrete usage boundaries, "
                "why it is worth discussing now, and what the creator can show."
            ),
            "schema": {
                "why_post": "string",
                "differentiation_angle": "string",
                "target_audience": "string",
                "engagement_estimate": "high|medium|low",
                "draft_tweet": "string",
                "draft_script": "string",
                "draft_outline": "string",
            },
        }

    def _degraded(
        self,
        fallback_topic: TopicSuggestion,
        reason: str,
    ) -> TopicSuggestion:
        return replace(
            fallback_topic,
            generation_status="degraded",
            generation_reason=reason,
        )


def _text(value: object, fallback: str) -> str:
    text = str(value).strip() if value is not None else ""
    return text or fallback


def _engagement(value: object, fallback: str) -> str:
    text = str(value).strip().lower() if value is not None else ""
    return text if text in {"high", "medium", "low"} else fallback
