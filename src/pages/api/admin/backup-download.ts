import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { spawn } from 'node:child_process';
import type { APIRoute } from 'astro';
import { isAdminAuthorized } from '../../../lib/adminAuth';

export const prerender = false;

async function firstExistingPath(candidates: string[]) {
  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Try next candidate.
    }
  }
  return '';
}

function runTar(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn('tar', args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(stderr.trim() || `tar exited with code ${code}`));
    });
  });
}

function safeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, '-');
}

async function createBackupResponse(request: Request) {
  if (!(await isAdminAuthorized(request))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const repoPocketBaseDir = path.resolve(process.cwd(), 'pocketbase');
  const dataDir = await firstExistingPath([
    process.env.PB_DATA_DIR ?? '',
    '/opt/spornerede/pocketbase/pb_data',
    path.join(repoPocketBaseDir, 'pb_data'),
  ].filter(Boolean));
  const publicDir = await firstExistingPath([
    process.env.PB_PUBLIC_DIR ?? '',
    '/opt/spornerede/pocketbase/pb_public',
    path.join(repoPocketBaseDir, 'pb_public'),
  ].filter(Boolean));

  if (!dataDir) {
    return new Response(JSON.stringify({ error: 'PocketBase data directory not found' }), { status: 500 });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'spornerede-admin-backup-'));
  const archiveName = safeFilename(`spornerede-data-backup-${timestamp}.tar.gz`);
  const archivePath = path.join(tempDir, archiveName);

  const tarArgs = ['-czf', archivePath, '-C', path.dirname(dataDir), path.basename(dataDir)];
  if (publicDir) {
    tarArgs.push('-C', path.dirname(publicDir), path.basename(publicDir));
  }

  try {
    await runTar(tarArgs);
    const stat = await fs.stat(archivePath);
    const stream = createReadStream(archivePath);
    stream.on('close', () => {
      fs.rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
    });

    return new Response(Readable.toWeb(stream) as BodyInit, {
      headers: {
        'Content-Type': 'application/gzip',
        'Content-Length': String(stat.size),
        'Content-Disposition': `attachment; filename="${archiveName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Backup could not be created',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export const GET: APIRoute = async ({ request }) => createBackupResponse(request);
export const POST: APIRoute = async ({ request }) => createBackupResponse(request);
