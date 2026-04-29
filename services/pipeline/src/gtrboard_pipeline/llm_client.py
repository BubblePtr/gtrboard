from __future__ import annotations

import json
import os
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from gtrboard_pipeline.env import load_pipeline_env


DEFAULT_MODEL = "qwen3.6-max-preview"


class MissingAPIKeyError(RuntimeError):
    pass


class OpenAICompatibleChatClient:
    def __init__(
        self,
        *,
        model: str | None = None,
        timeout: float = 120.0,
    ) -> None:
        load_pipeline_env()
        self.model = model or os.getenv("OPENAI_MODEL") or DEFAULT_MODEL
        self.timeout = timeout

    def complete_json(
        self,
        *,
        system_prompt: str,
        user_payload: dict[str, Any],
        temperature: float,
    ) -> dict[str, Any]:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise MissingAPIKeyError("OPENAI_API_KEY is not set")

        payload = {
            "model": self.model,
            "temperature": temperature,
            "messages": [
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": json.dumps(user_payload, ensure_ascii=False),
                },
            ],
        }
        data = self._post_json(api_key, payload)
        content = data["choices"][0]["message"]["content"]
        return _parse_json_object(content)

    def _post_json(self, api_key: str, payload: dict[str, Any]) -> dict[str, Any]:
        base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
        request = Request(
            f"{base_url}/chat/completions",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        try:
            with urlopen(request, timeout=self.timeout) as response:
                return json.loads(response.read().decode("utf-8"))
        except HTTPError as error:
            detail = error.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"HTTP {error.code}: {detail}") from error
        except URLError as error:
            raise RuntimeError(str(error.reason)) from error


def _parse_json_object(content: str) -> dict[str, Any]:
    text = _strip_markdown_fence(content.strip())
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        data = _parse_embedded_json_object(text)
    if not isinstance(data, dict):
        raise ValueError("LLM response must be a JSON object")
    return data


def _strip_markdown_fence(text: str) -> str:
    if not text.startswith("```"):
        return text
    lines = text.splitlines()
    if lines and lines[0].startswith("```"):
        lines = lines[1:]
    if lines and lines[-1].startswith("```"):
        lines = lines[:-1]
    return "\n".join(lines).strip()


def _parse_embedded_json_object(text: str) -> dict[str, Any]:
    decoder = json.JSONDecoder()
    for index, char in enumerate(text):
        if char != "{":
            continue
        try:
            data, _ = decoder.raw_decode(text[index:])
            if isinstance(data, dict):
                return data
        except json.JSONDecodeError:
            continue
    raise ValueError("LLM response did not contain a JSON object")
