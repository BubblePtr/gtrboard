from __future__ import annotations

import os
from pathlib import Path


ENV_FILE_NAMES = (".env.local", ".env.loacl", ".env")


def load_pipeline_env(root: Path | None = None) -> None:
    repo_root = root or Path(__file__).resolve().parents[4]
    for name in ENV_FILE_NAMES:
        env_path = repo_root / name
        if env_path.exists():
            _load_env_file(env_path)


def _load_env_file(env_path: Path) -> None:
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        if line.startswith("export "):
            line = line.removeprefix("export ").strip()

        key, value = line.split("=", 1)
        key = key.strip()
        if not key or key in os.environ:
            continue

        os.environ[key] = _strip_quotes(value.strip())


def _strip_quotes(value: str) -> str:
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        return value[1:-1]
    return value
