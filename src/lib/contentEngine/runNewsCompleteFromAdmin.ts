import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

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
  const args = ['tsx', 'src/cli/run-news-complete-json.ts', String(legacyId)];

  return new Promise((resolvePromise) => {
    const child = spawn('npx', args, {
      cwd: contentEngineRoot,
      shell: true,
      env: process.env,
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
