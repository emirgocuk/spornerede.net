import { getContentEngineRoot } from './contentEngineRoot.js';
import { spawnContentEngineCli, ContentEngineSpawnError } from './spawnContentEngine.js';
import { runContentEngineScript } from './spawnContentEngineWait.js';

const contentEngineRoot = getContentEngineRoot();
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

function spawnNewsDraft(
  konu: string,
  extraEnv: Record<string, string> = {},
): Promise<{ result: NewsDraftRunResult; raw: string }> {
  const topic = konu.trim();
  const extraArgs = ['--', topic];

  return new Promise((resolvePromise) => {
    let settled = false;
    const finish = (value: { result: NewsDraftRunResult; raw: string }) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolvePromise(value);
    };

    const child = spawnContentEngineCli('src/cli/run-news-draft-json.ts', extraArgs, {
      cwd: contentEngineRoot,
      env: { ...extraEnv, SEO_NEWS_KONU: topic },
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
        result: {
          ok: false,
          code: 'timeout',
          message: `Haber uretimi ${Math.round(PIPELINE_TIMEOUT_MS / 60_000)} dakikada bitmedi.`,
        },
        raw: out,
      });
    }, PIPELINE_TIMEOUT_MS);

    child.on('close', () => {
      const lines = out
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      const jsonLine = [...lines].reverse().find((l) => l.startsWith('{'));
      if (!jsonLine) {
        const tail = out.trim().slice(-600);
        finish({
          result: {
            ok: false,
            code: 'error',
            message: needsCollectionRepair(out)
              ? 'seo_keywords koleksiyonu bulunamadi. Sayfayi yenileyip tekrar deneyin.'
              : tail || 'Haber uretimi ciktisi okunamadi.',
          },
          raw: out,
        });
        return;
      }
      try {
        finish({ result: JSON.parse(jsonLine) as NewsDraftRunResult, raw: out });
      } catch {
        finish({
          result: { ok: false, code: 'error', message: 'JSON parse hatasi' },
          raw: out,
        });
      }
    });

    child.on('error', (err) =>
      finish({
        result: { ok: false, code: 'error', message: err.message },
        raw: out,
      }),
    );
  });
}

function needsCollectionRepair(output: string): boolean {
  return /Missing collection context|seo_keywords.*404|collections\/seo_keywords/i.test(output);
}

async function repairContentEngineSchema(): Promise<string | null> {
  const repair = await runContentEngineScript('src/cli/force-repair-seo-keywords.ts');
  if (!repair.ok) {
    return repair.output.trim().slice(-400) || 'force-repair basarisiz';
  }
  return null;
}

export async function runNewsDraftFromAdmin(
  konu: string,
  keywordId?: string,
): Promise<NewsDraftRunResult> {
  const topic = konu.trim();
  if (!topic) {
    return { ok: false, code: 'no_topic', message: 'Konu/keyword bos.' };
  }

  const spawnEnv: Record<string, string> = { SEO_NEWS_KONU: topic };
  if (keywordId?.trim()) {
    spawnEnv.SEO_NEWS_KEYWORD_ID = keywordId.trim();
  }

  try {
    let attempt = await spawnNewsDraft(topic, spawnEnv);
    if (attempt.result.ok || !needsCollectionRepair(attempt.raw)) {
      return attempt.result;
    }

    const repairErr = await repairContentEngineSchema();
    if (repairErr) {
      return {
        ok: false,
        code: 'error',
        message: `seo_keywords onarilamadi: ${repairErr}`,
      };
    }

    attempt = await spawnNewsDraft(topic, spawnEnv);
    return attempt.result;
  } catch (e) {
    if (e instanceof ContentEngineSpawnError) {
      return { ok: false, code: 'error', message: e.message };
    }
    throw e;
  }
}
