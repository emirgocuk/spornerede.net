import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Astro standalone (server/chunks) ve dev (src/lib) icin content-engine kokunu bulur */
export function getContentEngineRoot(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    resolve(process.cwd(), 'content-engine'),
    resolve(here, '../../content-engine'),
    resolve(here, '../../../content-engine'),
  ];
  for (const dir of candidates) {
    if (existsSync(join(dir, 'package.json'))) {
      return dir;
    }
  }
  return candidates[0];
}

export function resolveContentEngineTsx(cwd = getContentEngineRoot()): string | null {
  const candidates = [
    join(cwd, 'node_modules', 'tsx', 'dist', 'cli.mjs'),
    join(process.cwd(), 'node_modules', 'tsx', 'dist', 'cli.mjs'),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}
