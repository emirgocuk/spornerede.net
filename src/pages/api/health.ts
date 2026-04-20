import type { APIRoute } from 'astro';
import net from 'node:net';
import { Client } from 'pg';

export const prerender = false;

type CheckResult = {
  ok: boolean;
  configured: boolean;
  message?: string;
};

const DEFAULT_TIMEOUT_MS = 2500;

async function checkDatabaseConnectivity(): Promise<CheckResult> {
  const databaseUrl = import.meta.env.DATABASE_URL;
  if (!databaseUrl) {
    return { ok: false, configured: false, message: 'DATABASE_URL missing' };
  }

  const client = new Client({
    connectionString: databaseUrl,
    connectionTimeoutMillis: DEFAULT_TIMEOUT_MS,
  });

  try {
    await client.connect();
    await client.query('select 1 as ok');
    return { ok: true, configured: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'database check failed';
    return { ok: false, configured: true, message };
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function checkSmtpConnectivity(): Promise<CheckResult> {
  const host = import.meta.env.SMTP_HOST;
  const portRaw = import.meta.env.SMTP_PORT;
  const user = import.meta.env.SMTP_USER;
  const pass = import.meta.env.SMTP_PASS;
  const mailTo = import.meta.env.MAIL_TO;

  const configured = Boolean(host && user && pass && mailTo);
  if (!configured) {
    return { ok: false, configured: false, message: 'SMTP vars missing' };
  }

  const port = Number(portRaw || 587);
  if (!Number.isFinite(port) || port <= 0) {
    return { ok: false, configured: true, message: 'SMTP_PORT invalid' };
  }

  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port, timeout: DEFAULT_TIMEOUT_MS });

    const finish = (result: CheckResult) => {
      socket.removeAllListeners();
      if (!socket.destroyed) socket.destroy();
      resolve(result);
    };

    socket.once('connect', () => finish({ ok: true, configured: true }));
    socket.once('timeout', () => finish({ ok: false, configured: true, message: 'SMTP timeout' }));
    socket.once('error', (error) => {
      finish({
        ok: false,
        configured: true,
        message: error instanceof Error ? error.message : 'SMTP connect failed',
      });
    });
  });
}

export const GET: APIRoute = async () => {
  const deep = Astro.url.searchParams.get('deep') === '1';
  const hasDb = Boolean(import.meta.env.DATABASE_URL);
  const hasSmtpConfig = Boolean(
    import.meta.env.SMTP_HOST &&
      import.meta.env.SMTP_USER &&
      import.meta.env.SMTP_PASS &&
      import.meta.env.MAIL_TO
  );

  let dbCheck: CheckResult | null = null;
  let smtpCheck: CheckResult | null = null;

  if (deep) {
    dbCheck = await checkDatabaseConnectivity();
    smtpCheck = await checkSmtpConnectivity();
  }

  const status = !deep
    ? 'ok'
    : dbCheck?.ok && smtpCheck?.ok
      ? 'ok'
      : 'degraded';

  return new Response(
    JSON.stringify({
      status,
      timestamp: new Date().toISOString(),
      mode: deep ? 'deep' : 'basic',
      checks: {
        databaseConfigured: hasDb,
        smtpConfigured: hasSmtpConfig,
        ...(deep
          ? {
              databaseConnectivity: dbCheck,
              smtpConnectivity: smtpCheck,
            }
          : {}),
      },
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
};

