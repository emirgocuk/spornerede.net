import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getContentEngineRoot, resolveContentEngineTsx } from './contentEngineRoot.js';

/** Ana uygulama (systemd .env) PocketBase degerleri content-engine/.env ile ezilmesin */
const POCKETBASE_KEYS = new Set([
  'POCKETBASE_URL',
  'POCKETBASE_ADMIN_EMAIL',
  'POCKETBASE_ADMIN_PASSWORD',
]);

/** content-engine/.env — OpenRouter vb.; PB kimligi ana process.env'den gelir */
export function loadContentEngineEnv(cwd: string): NodeJS.ProcessEnv {
  const envPath = join(cwd, '.env');
  const merged = { ...process.env, FORCE_COLOR: '0' };
  if (!existsSync(envPath)) return merged;

  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!key) continue;
    if (POCKETBASE_KEYS.has(key) && process.env[key]?.trim()) {
      continue;
    }
    merged[key] = value;
  }
  return merged;
}

export class ContentEngineSpawnError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContentEngineSpawnError';
  }
}

/** node + tsx — npx kullanilmaz (systemd PATH'te npx yok) */
export function spawnContentEngineCli(
  scriptRelPath: string,
  extraArgs: string[] = [],
  options?: { cwd?: string; env?: NodeJS.ProcessEnv },
): ChildProcessWithoutNullStreams {
  const cwd = options?.cwd ?? getContentEngineRoot();
  const env = { ...loadContentEngineEnv(cwd), ...options?.env };
  const tsxCli = resolveContentEngineTsx(cwd);

  if (!tsxCli) {
    throw new ContentEngineSpawnError(
      `content-engine tsx bulunamadi (${cwd}). Sunucuda: cd content-engine && npm ci --include=dev`,
    );
  }

  return spawn(process.execPath, [tsxCli, scriptRelPath, ...extraArgs], {
    cwd,
    shell: false,
    env,
    windowsHide: true,
  });
}
