from __future__ import annotations

from gtrboard_pipeline.models import RawProject


FIXTURE_PROJECTS = [
    RawProject(
        github_url="https://github.com/ggerganov/llama.cpp",
        owner="ggerganov",
        name="llama.cpp",
        language="C++",
        stars=82700,
        description="LLM inference in C/C++ for local-first applications.",
    ),
    RawProject(
        github_url="https://github.com/browser-use/browser-use",
        owner="browser-use",
        name="browser-use",
        language="Python",
        stars=18700,
        description="Make websites accessible for AI agents and browser automation.",
    ),
    RawProject(
        github_url="https://github.com/pgvector/pgvector",
        owner="pgvector",
        name="pgvector",
        language="TypeScript",
        stars=17100,
        description="Open-source vector similarity search for Postgres workflows.",
    ),
    RawProject(
        github_url="https://github.com/tinygrad/tinygrad",
        owner="tinygrad",
        name="tinygrad",
        language="Python",
        stars=31200,
        description="A tiny neural network framework for ML systems exploration.",
    ),
    RawProject(
        github_url="https://github.com/openai/codex",
        owner="openai",
        name="codex",
        language="TypeScript",
        stars=41000,
        description="Coding agent tooling for software engineering workflows.",
    ),
]
