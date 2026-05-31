import { resolve } from 'node:path';
import { spawnContentEngineCli } from './spawnContentEngine.js';

const contentEngineRoot = resolve(process.cwd(), 'content-engine');

export type CompleteNewsRunResult =
  | {
      ok: true;
      legacyId: number;
      slug: string;
      complete: boolean;
      wordCount: number;
      issues: string[];
      modelUsed: string;
      rewritten: boolean;
    }
  | { ok: false; code: string; message: string };

export function runNewsCompleteFromAdmin(legacyId: number): Promise<CompleteNewsRunResult> {
  return new Promise((resolvePromise) => {
    const child = spawnContentEngineCli('src/cli/run-news-complete-json.ts', [String(legacyId)], {
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
        resolvePromise({
          ok: false,
          code: 'error',
          message: out.trim() || 'Tamamlama ciktisi okunamadi.',
        });
        return;
      }
      try {
        resolvePromise(JSON.parse(jsonLine) as CompleteNewsRunResult);
      } catch {
        resolvePromise({ ok: false, code: 'error', message: 'JSON parse hatasi' });
      }
    });
    child.on('error', (err) =>
      resolvePromise({ ok: false, code: 'error', message: err.message }),
    );
  });
}
