from __future__ import annotations

import argparse
import asyncio
from pathlib import Path

from gtrboard_pipeline.env import load_pipeline_env
from gtrboard_pipeline.llm_client import DEFAULT_MODEL
from gtrboard_pipeline.pipeline import PipelineConfig, PipelineOrchestrator


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="gtr-pipeline",
        description="Run the GTR-Board Python discovery pipeline.",
    )
    subparsers = parser.add_subparsers(dest="command")

    run = subparsers.add_parser("run", help="Execute the discovery pipeline")
    run.add_argument("--source", choices=["fixtures", "legacy"], default="fixtures")
    run.add_argument("--lang", action="append", dest="languages", default=None)
    run.add_argument("--limit", type=int, default=10)
    run.add_argument("--top-n", type=int, default=5)
    run.add_argument("--output-dir", type=Path, default=Path("reports"))
    run.add_argument("--positioning", default="本地AI实战派")
    run.add_argument("--model", default=None)

    return parser


def main() -> None:
    load_pipeline_env()
    parser = build_parser()
    args = parser.parse_args()

    if args.command != "run":
        parser.print_help()
        return

    config = PipelineConfig(
        source=args.source,
        languages=args.languages,
        limit=args.limit,
        top_n=args.top_n,
        output_dir=args.output_dir,
        positioning=args.positioning,
        model=args.model or DEFAULT_MODEL,
    )
    result = asyncio.run(PipelineOrchestrator(config).run())

    print(f"Pipeline status: {result.status}")
    print(f"Collected: {result.projects_collected}")
    print(f"Analyzed: {result.projects_analyzed}")
    print(f"Topics: {result.topics_generated}")
    print(f"Report: {result.report_path}")
