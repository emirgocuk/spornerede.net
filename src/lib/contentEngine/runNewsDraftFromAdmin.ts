import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const contentEngineRoot = resolve(process.cwd(), 'content-engine');
/** Admin UI — LLM zinciri icin ust sinir (asilirsa surec oldurulur) */
const PIPELINE_TIMEOUT_MS = Math.max(
  60_000,
  Number(process.env.SEO_NEWS_PIPELINE_TIMEOUT_MS) || 240_000,
);

export type NewsDraftRunResult =
  | {
      ok: true;
      legacyId: number;
      slug: string;
      baslik: string;
      modelUsed: string;
      konu: string;
      templateId?: string;
      autoPublished?: boolean;
    }
  | {
      ok: false;
      code: string;
      message: string;
    };

export function runNewsDraftFromAdmin(konu?: string): Promise<NewsDraftRunResult> {
  const args = ['tsx', 'src/cli/run-news-draft-json.ts'];
  if (konu?.trim()) {
    args.push('--', konu.trim());
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: NewsDraftRunResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };

    const child = spawn('npx', args, {
      cwd: contentEngineRoot,
      shell: true,
      env: { ...process.env, FORCE_COLOR: '0' },
    });

    let out = '';
    child.stdout?.on('data', (d) => {
      out += String(d);
    });
    child.stderr?.on('data', (d) => {
      out += String(d);
    });

    const timer = setTimeout(() => {
      try {
        child.kill();
      } catch {
        /* */
      }
      finish({
        ok: false,
        code: 'timeout',
        message: `Haber uretimi ${Math.round(PIPELINE_TIMEOUT_MS / 60_000)} dakikada bitmedi. Model yavas veya kota dolu olabilir; tekrar deneyin.`,
      });
    }, PIPELINE_TIMEOUT_MS);

    child.on('close', () => {
      const lines = out
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      const jsonLine = [...lines].reverse().find((l) => l.startsWith('{'));
      if (!jsonLine) {
        const tail = out.trim().slice(-400);
        finish({
          ok: false,
          code: 'error',
          message: tail || 'Haber uretimi ciktisi okunamadi.',
        });
        return;
      }
      try {
        finish(JSON.parse(jsonLine) as NewsDraftRunResult);
      } catch {
        finish({
          ok: false,
          code: 'error',
          message: 'JSON parse hatasi',
        });
      }
    });

    child.on('error', (err) =>
      finish({ ok: false, code: 'error', message: err.message }),
    );
  });
}
