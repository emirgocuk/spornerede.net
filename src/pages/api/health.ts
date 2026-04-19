import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async () => {
  const hasDb = Boolean(import.meta.env.DATABASE_URL);
  const hasSmtp = Boolean(import.meta.env.SMTP_HOST && import.meta.env.SMTP_USER && import.meta.env.MAIL_TO);

  return new Response(
    JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      checks: {
        databaseConfigured: hasDb,
        smtpConfigured: hasSmtp,
      },
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
};

