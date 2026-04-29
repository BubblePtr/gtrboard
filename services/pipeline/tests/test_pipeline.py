import asyncio
import json
import os
import sys
from dataclasses import replace
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import TestCase
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from gtrboard_pipeline.collectors import TrendingHTMLParser
from gtrboard_pipeline.env import load_pipeline_env
from gtrboard_pipeline.llm_profile_scorer import OpenAICompatibleProfileScorer
from gtrboard_pipeline.llm_strategist import OpenAICompatibleStrategist
from gtrboard_pipeline.models import ProjectProfile, RawProject, TopicSuggestion
from gtrboard_pipeline.pipeline import PipelineConfig, PipelineOrchestrator


class PassthroughScorer:
    async def analyze(self, project, fallback_profile):
        return fallback_profile


class PassthroughStrategist:
    async def generate(self, profile, fallback_topic):
        return fallback_topic


class PipelineTest(TestCase):
    def test_fixture_pipeline_generates_ranked_report_and_json_artifact(self):
        with TemporaryDirectory() as tmpdir:
            output_dir = Path(tmpdir)
            config = PipelineConfig(
                source="fixtures",
                limit=3,
                top_n=2,
                output_dir=output_dir,
            )

            result = asyncio.run(
                PipelineOrchestrator(
                    config,
                    profile_scorer=PassthroughScorer(),
                    strategist=PassthroughStrategist(),
                ).run()
            )

            self.assertEqual("success", result.status)
            self.assertEqual(3, result.projects_collected)
            self.assertEqual(3, result.projects_analyzed)
            self.assertEqual(3, result.topics_generated)
            self.assertEqual(
                ["collect", "profile", "strategize", "curate", "report"],
                [stage.name for stage in result.stages],
            )
            self.assertEqual(["complete"] * 5, [stage.status for stage in result.stages])
            self.assertEqual(2, len(result.report.topics))
            self.assertGreaterEqual(
                result.report.topics[0].final_score,
                result.report.topics[1].final_score,
            )
            self.assertTrue(result.report_path.exists())
            self.assertIn("GitHub Trending 每日选题报告", result.report_path.read_text())

            artifact_path = output_dir / "latest_pipeline_run.json"
            self.assertTrue(artifact_path.exists())
            artifact = json.loads(artifact_path.read_text())
            self.assertEqual("success", artifact["status"])
            self.assertEqual(2, len(artifact["topics"]))

    def test_unknown_source_fails_fast(self):
        with self.assertRaisesRegex(ValueError, "Unknown source"):
            PipelineConfig(source="unknown")

    def test_trending_html_parser_extracts_repository_metadata(self):
        html = """
        <article class="Box-row">
          <h2><a href="/owner/repo"> owner / repo </a></h2>
          <p class="col-9 color-fg-muted my-1 pr-4">Useful local AI server.</p>
          <span itemprop="programmingLanguage">Python</span>
          <a href="/owner/repo/stargazers">1.2k</a>
        </article>
        """

        projects = TrendingHTMLParser(language="python").parse(html)

        self.assertEqual(1, len(projects))
        self.assertEqual("https://github.com/owner/repo", projects[0].github_url)
        self.assertEqual("owner", projects[0].owner)
        self.assertEqual("repo", projects[0].name)
        self.assertEqual("Python", projects[0].language)
        self.assertEqual(1200, projects[0].stars)

    def test_pipeline_uses_llm_profile_scorer_when_available(self):
        class FakeScorer:
            async def analyze(self, project, fallback_profile):
                return ProjectProfile(
                    project=project,
                    novelty_score=10,
                    utility_score=9,
                    doc_quality_score=8,
                    local_ai_relevance=7,
                    tags=["LLM scored"],
                    summary="LLM scored summary",
                    analysis_status="complete",
                )

        with TemporaryDirectory() as tmpdir:
            result = asyncio.run(
                PipelineOrchestrator(
                    PipelineConfig(
                        source="fixtures",
                        limit=1,
                        top_n=1,
                        output_dir=Path(tmpdir),
                    ),
                    profile_scorer=FakeScorer(),
                    strategist=PassthroughStrategist(),
                ).run()
            )

            topic = result.report.topics[0].topic
            self.assertEqual("complete", topic.profile.analysis_status)
            self.assertEqual("LLM scored summary", topic.profile.summary)
            self.assertEqual(["LLM scored"], topic.profile.tags)
            self.assertGreaterEqual(topic.final_score or 0, 7)

    def test_openai_profile_scorer_degrades_without_api_key(self):
        project = RawProject(
            github_url="https://github.com/owner/repo",
            owner="owner",
            name="repo",
            language="Python",
            stars=100,
            description="Useful AI workflow tool",
        )
        fallback = ProjectProfile(
            project=project,
            novelty_score=4,
            utility_score=5,
            doc_quality_score=6,
            local_ai_relevance=7,
            tags=["fallback"],
            summary="fallback summary",
            analysis_status="heuristic",
        )

        with patch.dict("os.environ", {}, clear=True), patch(
            "gtrboard_pipeline.llm_client.load_pipeline_env",
        ):
            result = asyncio.run(
                OpenAICompatibleProfileScorer().analyze(project, fallback)
            )

        self.assertEqual("degraded", result.analysis_status)
        self.assertIn("OPENAI_API_KEY", result.analysis_reason or "")
        self.assertEqual(fallback.summary, result.summary)

    def test_pipeline_uses_llm_strategist_when_available(self):
        class FakeScorer:
            async def analyze(self, project, fallback_profile):
                return fallback_profile

        class FakeStrategist:
            async def generate(self, profile, fallback_topic):
                return replace(
                    fallback_topic,
                    why_post="LLM selected this repository for a focused topic.",
                    differentiation_angle="LLM angle",
                    generation_status="complete",
                )

        with TemporaryDirectory() as tmpdir:
            result = asyncio.run(
                PipelineOrchestrator(
                    PipelineConfig(
                        source="fixtures",
                        limit=1,
                        top_n=1,
                        output_dir=Path(tmpdir),
                    ),
                    profile_scorer=FakeScorer(),
                    strategist=FakeStrategist(),
                ).run()
            )

            topic = result.report.topics[0].topic
            self.assertEqual(
                "LLM selected this repository for a focused topic.",
                topic.why_post,
            )
            self.assertEqual("LLM angle", topic.differentiation_angle)
            self.assertEqual("complete", topic.generation_status)

    def test_openai_strategist_degrades_without_api_key(self):
        project = RawProject(
            github_url="https://github.com/owner/repo",
            owner="owner",
            name="repo",
            language="Python",
            stars=100,
            description="Useful AI workflow tool",
        )
        profile = ProjectProfile(
            project=project,
            novelty_score=4,
            utility_score=5,
            doc_quality_score=6,
            local_ai_relevance=7,
            tags=["fallback"],
            summary="fallback summary",
        )
        fallback = TopicSuggestion(
            profile=profile,
            why_post="fallback reason",
            differentiation_angle="fallback angle",
            target_audience="fallback audience",
            engagement_estimate="medium",
            draft_tweet="fallback tweet",
            draft_script="fallback script",
            draft_outline="fallback outline",
        )

        with patch.dict("os.environ", {}, clear=True), patch(
            "gtrboard_pipeline.llm_client.load_pipeline_env",
        ):
            result = asyncio.run(
                OpenAICompatibleStrategist().generate(profile, fallback)
            )

        self.assertEqual("degraded", result.generation_status)
        self.assertIn("OPENAI_API_KEY", result.generation_reason or "")
        self.assertEqual(fallback.draft_tweet, result.draft_tweet)

    def test_env_loader_reads_local_typo_file_without_overriding_existing_values(self):
        with TemporaryDirectory() as tmpdir:
            env_path = Path(tmpdir) / ".env.loacl"
            env_path.write_text(
                "OPENAI_API_KEY=from_typo_file\nOPENAI_MODEL=qwen-from-file\n",
                encoding="utf-8",
            )

            with patch.dict("os.environ", {"OPENAI_MODEL": "already-set"}, clear=True):
                load_pipeline_env(Path(tmpdir))

                self.assertEqual("from_typo_file", os.environ["OPENAI_API_KEY"])
                self.assertEqual("already-set", os.environ["OPENAI_MODEL"])
