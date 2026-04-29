import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import { SidebarIcon } from '@phosphor-icons/react'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import {
  LayoutDashboard,
  MessageSquareText,
  Settings,
  Workflow,
} from 'lucide-react'
import { useState } from 'react'

import { Button } from '../components/ui/button'
import { TooltipProvider } from '../components/ui/tooltip'
import { cn } from '../lib/utils'

import StoreDevtools from '../lib/demo-store-devtools'

import appCss from '../styles.css?url'

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'GTR-Board',
      },
      {
        name: 'description',
        content:
          'A chat-first AI workspace for evaluating GitHub Trending projects as content topics.',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  component: RootComponent,
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="font-sans antialiased [overflow-wrap:anywhere] selection:bg-primary/15">
        {children}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            StoreDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}

function RootComponent() {
  return (
    <TooltipProvider>
      <AppShell>
        <Outlet />
      </AppShell>
    </TooltipProvider>
  )
}

const navItems = [
  { to: '/', label: 'Dashboard', exact: true, icon: LayoutDashboard },
  { to: '/topics', label: '选题管理', icon: MessageSquareText },
  { to: '/pipeline', label: 'Pipeline', icon: Workflow },
  { to: '/settings', label: '设置', icon: Settings },
] as const

function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#fafafa] text-slate-950">
      <header className="flex h-8 shrink-0 items-center gap-3 bg-[#fafafa] px-4">
        <Link
          to="/"
          className="flex min-w-0 items-center text-slate-950 no-underline"
        >
          <span className="shrink-0 text-sm font-bold tracking-wide text-slate-950">
            GTR
          </span>
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}
          className="hidden size-6 rounded-none p-0 text-slate-500 hover:bg-transparent hover:text-slate-950 lg:inline-flex"
          onClick={() => setCollapsed((value) => !value)}
        >
          <SidebarIcon
            aria-hidden="true"
            weight="fill"
            className={cn('size-[18px]', collapsed && 'scale-x-[-1]')}
          />
        </Button>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden bg-[#fafafa]">
        <aside
          className={cn(
            'hidden shrink-0 bg-transparent lg:flex lg:flex-col',
            collapsed ? 'w-16' : 'w-48',
          )}
        >
          <nav className="flex flex-1 flex-col gap-1 px-2 py-4">
            {navItems.map((item) => {
              const Icon = item.icon

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  preload="intent"
                  activeOptions={{ exact: item.exact }}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center rounded-full text-sm font-medium text-slate-500 no-underline transition hover:bg-white/75 hover:text-slate-950',
                    collapsed
                      ? 'mx-auto size-9 justify-center p-0'
                      : 'h-10 gap-2.5 px-3',
                  )}
                  activeProps={{
                    className: cn(
                      'flex items-center rounded-full bg-white text-sm font-semibold text-slate-950 no-underline shadow-sm ring-1 ring-slate-200/70 transition hover:bg-white hover:text-slate-950',
                      collapsed
                        ? 'mx-auto size-9 justify-center p-0'
                        : 'h-10 gap-2.5 px-3',
                    ),
                  }}
                >
                  <Icon aria-hidden="true" className="size-4 shrink-0" />
                  <span className={collapsed ? 'sr-only' : 'block truncate'}>
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </nav>

          {!collapsed ? (
            <div className="p-2">
              <div className="rounded-2xl bg-white/55 p-3 ring-1 ring-white/70">
                <p className="m-0 text-xs font-semibold text-slate-700">
                  Nightly discovery
                </p>
                <p className="m-0 mt-1 text-xs leading-5 text-slate-500">
                  Python services score GitHub Trending projects at 09:00.
                </p>
              </div>
            </div>
          ) : null}
        </aside>

        <main className="mx-auto h-full min-w-0 flex-1 overflow-hidden bg-[#fafafa] px-2 pb-2 lg:px-3">
          {children}
        </main>
      </div>
    </div>
  )
}
