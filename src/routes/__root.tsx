import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
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
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 hidden border-r border-slate-200 bg-white lg:flex lg:flex-col',
          collapsed ? 'w-20' : 'w-64',
        )}
      >
        <div
          className={cn(
            'flex h-16 items-center gap-3 border-b border-slate-200',
            collapsed ? 'justify-center px-0' : 'px-4',
          )}
        >
          <Link
            to="/"
            className={cn(
              'flex min-w-0 items-center gap-3 text-slate-950 no-underline',
              collapsed && 'justify-center',
            )}
          >
            <span className="shrink-0 text-sm font-bold tracking-wide text-slate-950">
              GTR
            </span>
            {!collapsed ? (
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">
                  GTR-Board
                </span>
                <span className="block truncate text-xs text-slate-500">
                  AI topic workspace
                </span>
              </span>
            ) : null}
          </Link>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon-xs"
          aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}
          className="absolute top-5 -right-3 z-20 rounded-full bg-white shadow-sm"
          onClick={() => setCollapsed((value) => !value)}
        >
          {collapsed ? '>' : '<'}
        </Button>

        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
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
                  'flex items-center rounded-md text-sm font-medium text-slate-600 no-underline transition hover:bg-slate-100 hover:text-slate-950',
                  collapsed
                    ? 'mx-auto size-9 justify-center p-0'
                    : 'h-10 gap-3 px-3',
                )}
                activeProps={{
                  className: cn(
                    'flex items-center rounded-md bg-slate-950 text-sm font-medium text-white no-underline transition hover:bg-slate-900 hover:text-white',
                    collapsed
                      ? 'mx-auto size-9 justify-center p-0'
                      : 'h-10 gap-3 px-3',
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
          <div className="border-t border-slate-200 p-3">
            <div className="rounded-md bg-slate-50 p-3">
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

      <div className={cn('min-h-screen', collapsed ? 'lg:pl-20' : 'lg:pl-64')}>
        <main className="mx-auto w-full max-w-[1440px] px-4 py-5 lg:px-6">
          {children}
        </main>
      </div>
    </div>
  )
}
