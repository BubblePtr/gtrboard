import { readFileSync, statSync } from 'node:fs'
import path from 'node:path'

// Support `.env.loacl` for compatibility with an early local setup typo.
const LOCAL_ENV_FILES = ['.env.local', '.env.loacl', '.env']

export function loadLocalEnv(cwd = process.cwd()) {
  for (const fileName of LOCAL_ENV_FILES) {
    const envPath = path.join(cwd, fileName)
    if (!statSync(envPath, { throwIfNoEntry: false })?.isFile()) continue

    for (const rawLine of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const line = rawLine.trim()
      if (!line || line.startsWith('#') || !line.includes('=')) continue

      const normalized = line.startsWith('export ')
        ? line.slice('export '.length).trim()
        : line
      const [rawKey, ...rawValueParts] = normalized.split('=')
      const key = rawKey.trim()
      if (!key || process.env[key] !== undefined) continue

      process.env[key] = stripQuotes(rawValueParts.join('=').trim())
    }
  }
}

function stripQuotes(value: string) {
  if (value.length < 2) return value
  const first = value[0]
  const last = value[value.length - 1]
  return first === last && (first === '"' || first === "'")
    ? value.slice(1, -1)
    : value
}
