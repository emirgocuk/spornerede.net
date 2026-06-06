import { spawnContentEngineCli } from './spawnContentEngine.js';

export function runContentEngineScript(
  scriptRelPath: string,
  extraArgs: string[] = [],
  timeoutMs = 120_000,
): Promise<{ ok: boolean; output: string; code: number | null }> {
  return new Promise((resolve) => {
    const child = spawnContentEngineCli(scriptRelPath, extraArgs);
    let out = '';
    const timer = setTimeout(() => {
      try {
        child.kill();
      } catch {
        /* */
      }
      resolve({ ok: false, output: out, code: null });
    }, timeoutMs);

    child.stdout?.on('data', (d) => {
      out += String(d);
    });
    child.stderr?.on('data', (d) => {
      out += String(d);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ ok: code === 0, output: out, code });
    });
    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({ ok: false, output: `${out}\n${err.message}`, code: null });
    });
  });
}
