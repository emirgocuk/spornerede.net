import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const defaultRoot = () => resolve(process.cwd(), 'content-engine');

/** Windows'ta shell:true → /bin/sh ENOENT; npx+shell yerine node+tsx veya npx.cmd */
export function spawnContentEngineCli(
  scriptRelPath: string,
  extraArgs: string[] = [],
  options?: { cwd?: string; env?: NodeJS.ProcessEnv },
): ChildProcessWithoutNullStreams {
  const cwd = options?.cwd ?? defaultRoot();
  const env = { ...process.env, FORCE_COLOR: '0', ...options?.env };

  const tsxCli = join(cwd, 'node_modules', 'tsx', 'dist', 'cli.mjs');
  if (existsSync(tsxCli)) {
    return spawn(process.execPath, [tsxCli, scriptRelPath, ...extraArgs], {
      cwd,
      shell: false,
      env,
      windowsHide: true,
    });
  }

  const isWin = process.platform === 'win32';
  const runner = isWin ? 'npx.cmd' : 'npx';
  return spawn(runner, ['tsx', scriptRelPath, ...extraArgs], {
    cwd,
    shell: false,
    env,
    windowsHide: true,
  });
}
