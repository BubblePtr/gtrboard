from __future__ import annotations

from html.parser import HTMLParser
from urllib.parse import urljoin
from urllib.request import Request, urlopen

from gtrboard_pipeline.fixtures import FIXTURE_PROJECTS
from gtrboard_pipeline.models import RawProject


class FixtureCollector:
    def __init__(self, languages: list[str], limit: int) -> None:
        self.languages = languages
        self.limit = limit

    async def collect(self) -> list[RawProject]:
        projects = list(FIXTURE_PROJECTS)
        normalized = {language.lower() for language in self.languages if language}
        if normalized:
            projects = [
                project
                for project in projects
                if project.language.lower() in normalized
                or project.name.lower() in normalized
                or project.owner.lower() in normalized
            ]
        if not projects:
            projects = list(FIXTURE_PROJECTS)
        return projects[: self.limit]


class LegacyTrendingCollector:
    def __init__(self, languages: list[str], limit: int, timeout: float = 30.0) -> None:
        self.languages = languages or [""]
        self.limit = limit
        self.timeout = timeout

    async def collect(self) -> list[RawProject]:
        projects: list[RawProject] = []
        seen_urls: set[str] = set()
        for language in self.languages:
            path = language.strip().lower()
            url = (
                "https://github.com/trending"
                if not path
                else f"https://github.com/trending/{path}"
            )
            html = self._fetch(url)
            parsed = TrendingHTMLParser(language=language or "all").parse(html)
            for project in parsed:
                if project.github_url in seen_urls:
                    continue
                seen_urls.add(project.github_url)
                projects.append(project)
                if len(projects) >= self.limit:
                    return projects
        return projects

    def _fetch(self, url: str) -> str:
        request = Request(
            url,
            headers={
                "User-Agent": "GTR-Board pipeline/0.1",
                "Accept": "text/html",
            },
        )
        with urlopen(request, timeout=self.timeout) as response:
            return response.read().decode("utf-8", errors="replace")


class TrendingHTMLParser(HTMLParser):
    def __init__(self, language: str) -> None:
        super().__init__()
        self.language = language
        self.projects: list[RawProject] = []
        self._in_article = False
        self._article_depth = 0
        self._current_href: str | None = None
        self._capture_text: str | None = None
        self._text_parts: list[str] = []
        self._repo: dict[str, str | int] = {}

    def parse(self, html: str) -> list[RawProject]:
        self.feed(html)
        return self.projects

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr = dict(attrs)
        if tag == "article" and "Box-row" in (attr.get("class") or ""):
            self._in_article = True
            self._article_depth = 1
            self._repo = {"language": self.language}
            return

        if not self._in_article:
            return

        self._article_depth += 1
        href = attr.get("href") or ""
        if (
            tag == "a"
            and href.startswith("/")
            and href.count("/") == 2
            and "github_url" not in self._repo
        ):
            self._current_href = href
            self._capture_text = "repo"
            self._text_parts = []
        elif tag == "p" and "color-fg-muted" in (attr.get("class") or ""):
            self._capture_text = "description"
            self._text_parts = []
        elif tag == "span" and attr.get("itemprop") == "programmingLanguage":
            self._capture_text = "language"
            self._text_parts = []
        elif tag == "a" and href.endswith("/stargazers"):
            self._capture_text = "stars"
            self._text_parts = []

    def handle_endtag(self, tag: str) -> None:
        if not self._in_article:
            return

        if self._capture_text and tag in {"a", "p", "span"}:
            self._finish_capture()

        if tag == "article":
            self._finish_article()
            self._in_article = False
            self._article_depth = 0
            return

        self._article_depth = max(0, self._article_depth - 1)

    def handle_data(self, data: str) -> None:
        if self._capture_text:
            self._text_parts.append(data)

    def _finish_capture(self) -> None:
        text = " ".join(" ".join(self._text_parts).split())
        if self._capture_text == "repo" and self._current_href:
            parts = self._current_href.strip("/").split("/")
            if len(parts) == 2:
                self._repo["owner"] = parts[0]
                self._repo["name"] = parts[1]
                self._repo["github_url"] = urljoin("https://github.com", self._current_href)
        elif self._capture_text == "description":
            self._repo["description"] = text
        elif self._capture_text == "language":
            self._repo["language"] = text
        elif self._capture_text == "stars":
            self._repo["stars"] = _parse_stars(text)
        self._capture_text = None
        self._current_href = None
        self._text_parts = []

    def _finish_article(self) -> None:
        if {"github_url", "owner", "name"}.issubset(self._repo):
            self.projects.append(
                RawProject(
                    github_url=str(self._repo["github_url"]),
                    owner=str(self._repo["owner"]),
                    name=str(self._repo["name"]),
                    language=str(self._repo.get("language") or ""),
                    stars=int(self._repo.get("stars") or 0),
                    description=str(self._repo.get("description") or ""),
                )
            )


def _parse_stars(text: str) -> int:
    value = text.replace(",", "").strip().lower()
    try:
        if value.endswith("k"):
            return int(float(value[:-1]) * 1000)
        return int(value)
    except ValueError:
        return 0
