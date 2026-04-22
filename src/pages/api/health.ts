import type { APIRoute } from 'astro';
import net from 'node:net';
import PocketBase from 'pocketbase';

export const prerender = false;

type CheckResult = {
  ok: boolean;
  configured: boolean;
  message?: string;
};

const DEFAULT_TIMEOUT_MS = 2500;

async function checkDatabaseConnectivity(): Promise<CheckResult> {
  const pocketbaseUrl = import.meta.env.POCKETBASE_URL;
  if (!pocketbaseUrl) {
    return { ok: false, configured: false, message: 'POCKETBASE_URL missing' };
  }

  try {
    const pb = new PocketBase(pocketbaseUrl);
    const adminEmail = import.meta.env.POCKETBASE_ADMIN_EMAIL;
    const adminPassword = import.meta.env.POCKETBASE_ADMIN_PASSWORD;
    if (!adminEmail || !adminPassword) {
      return { ok: false, configured: false, message: 'PocketBase admin credentials missing' };
    }
    await pb.collection('_superusers').authWithPassword(adminEmail, adminPassword);
    await pb.health.check();
    return { ok: true, configured: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'database check failed';
    return { ok: false, configured: true, message };
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

export const GET: APIRoute = async ({ url }) => {
  const deep = url.searchParams.get('deep') === '1';
  const hasDb = Boolean(import.meta.env.POCKETBASE_URL);
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

