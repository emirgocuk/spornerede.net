import { resolve } from 'node:path';
import { spawnContentEngineCli } from './spawnContentEngine.js';

const contentEngineRoot = resolve(process.cwd(), 'content-engine');

export type DraftRunResult =
  | {
      ok: true;
      id: string;
      slug: string;
      baslik: string;
      modelUsed: string;
      anahtar: string;
    }
  | {
      ok: false;
      code: string;
      message: string;
    };

export function runDraftFromAdmin(): Promise<DraftRunResult> {
  return new Promise((resolve) => {
    const child = spawnContentEngineCli('src/cli/run-draft-json.ts', [], {
      cwd: contentEngineRoot,
    });
    let out = '';
    child.stdout?.on('data', (d) => {
      out += String(d);
    });
    child.stderr?.on('data', (d) => {
      out += String(d);
    });
    child.on('close', () => {
      const lines = out
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      const jsonLine = [...lines].reverse().find((l) => l.startsWith('{'));
      if (!jsonLine) {
        resolve({
          ok: false,
          code: 'error',
          message: out.trim() || 'Content engine ciktisi okunamadi.',
        });
        return;
      }
      try {
        resolve(JSON.parse(jsonLine) as DraftRunResult);
      } catch {
        resolve({
          ok: false,
          code: 'error',
          message: 'JSON parse hatasi: ' + jsonLine.slice(0, 200),
        });
      }
    });
    child.on('error', (err) =>
      resolve({ ok: false, code: 'error', message: err.message }),
    );
  });
}
