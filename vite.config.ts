import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'

const isCloudflareBuild = process.env.GTR_DEPLOY_TARGET === 'cloudflare'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    isCloudflareBuild ? cloudflare({ viteEnvironment: { name: 'ssr' } }) : null,
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ].filter(Boolean),
})

export default config
