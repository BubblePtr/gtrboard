from __future__ import annotations

import asyncio
from dataclasses import replace
from typing import Any

from gtrboard_pipeline.llm_client import MissingAPIKeyError, OpenAICompatibleChatClient
from gtrboard_pipeline.models import ProjectProfile, RawProject


class OpenAICompatibleProfileScorer:
    def __init__(
        self,
        *,
        model: str | None = None,
        positioning: str = "本地AI实战派",
        timeout: float = 120.0,
    ) -> None:
        self.client = OpenAICompatibleChatClient(model=model, timeout=timeout)
        self.positioning = positioning

    async def analyze(
        self,
        project: RawProject,
        fallback_profile: ProjectProfile,
    ) -> ProjectProfile:
        try:
            output = await asyncio.to_thread(
                self.client.complete_json,
                system_prompt=(
                    "You score GitHub Trending repositories for a Chinese "
                    "technical content planning workspace. Return only valid JSON."
                ),
                user_payload=self._build_payload(project),
                temperature=0.2,
            )
            return ProjectProfile(
                project=project,
                novelty_score=_clamp_score(output.get("novelty_score")),
                utility_score=_clamp_score(output.get("utility_score")),
                doc_quality_score=_clamp_score(output.get("doc_quality_score")),
                local_ai_relevance=_clamp_score(output.get("local_ai_relevance")),
                tags=_normalize_tags(output.get("tags")),
                summary=str(output.get("summary") or fallback_profile.summary),
                analysis_status="complete",
            )
        except MissingAPIKeyError as error:
            return self._degraded(fallback_profile, str(error))
        except Exception as error:
            return self._degraded(fallback_profile, f"LLM scoring failed: {error}")

    def _build_payload(self, project: RawProject) -> dict[str, Any]:
        return {
            "positioning": self.positioning,
            "repository": {
                "name": f"{project.owner}/{project.name}",
                "url": project.github_url,
                "language": project.language,
                "stars": project.stars,
                "description": project.description,
            },
            "instructions": (
                "Score novelty_score, utility_score, doc_quality_score, and "
                "local_ai_relevance from 1 to 10. Add 1-5 short tags and a "
                "concise Chinese summary. Prefer practical content usefulness "
                "over hype."
            ),
            "schema": {
                "novelty_score": "integer 1..10",
                "utility_score": "integer 1..10",
                "doc_quality_score": "integer 1..10",
                "local_ai_relevance": "integer 1..10",
                "tags": ["string"],
                "summary": "string",
            },
        }

    def _degraded(self, fallback_profile: ProjectProfile, reason: str) -> ProjectProfile:
        return replace(
            fallback_profile,
            analysis_status="degraded",
            analysis_reason=reason,
        )


def _clamp_score(value: object) -> int:
    try:
        number = int(value)
    except (TypeError, ValueError):
        number = 5
    return max(1, min(10, number))


def _normalize_tags(value: object) -> list[str]:
    if not isinstance(value, list):
        return ["Open Source"]
    tags = [str(item).strip() for item in value if str(item).strip()]
    return tags[:5] or ["Open Source"]
