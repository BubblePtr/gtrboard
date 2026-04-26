import { Link } from '@tanstack/react-router'
import { Github, PanelTop, Sparkles } from 'lucide-react'

import { Button } from './ui/button'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/88 px-4 backdrop-blur-lg">
      <nav className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center gap-3 py-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground no-underline"
        >
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <PanelTop aria-hidden="true" className="size-4" />
          </span>
          GTR-Board
        </Link>

        <div className="order-3 flex w-full flex-wrap items-center gap-4 text-sm font-medium sm:order-2 sm:w-auto">
          <Link
            to="/"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            Workspace
          </Link>
          <Link
            to="/demo/ai-chat"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            AI starter
          </Link>
          <Link
            to="/demo/store"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            Store demo
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <a
              href="https://github.com/trending"
              target="_blank"
              rel="noreferrer"
            >
              <Github data-icon="inline-start" />
              Trending
            </a>
          </Button>
          <Button size="sm" asChild>
            <a href="/demo/ai-image">
              <Sparkles data-icon="inline-start" />
              Generate
            </a>
          </Button>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
