import nodemailer from 'nodemailer';
import fs from 'node:fs';
import path from 'node:path';
import { getDb, hasDatabaseUrl } from '../../db/client';

type QueueMailInput = {
  kind: 'application_notification' | 'password_reset' | 'club_announcement' | 'test_mail' | string;
  toEmail: string;
  subject: string;
  html: string;
  replyTo?: string;
};

type QueuedRecord = {
  id: string;
  kind: string;
  toEmail: string;
  subject: string;
  html: string;
  replyTo?: string;
  status?: string;
  attemptCount?: number;
  nextAttemptAt?: string;
  created?: string;
};

const MAIL_STATUS_PENDING = 'pending';
const MAIL_STATUS_SENT = 'sent';
const MAIL_STATUS_FAILED = 'failed';
const MAX_RETRY = 3;

function getSmtpConfig() {
  const host = process.env.SMTP_HOST ?? import.meta.env.SMTP_HOST;
  const portRaw = process.env.SMTP_PORT ?? import.meta.env.SMTP_PORT ?? '587';
  const port = Number(portRaw);
  const user = process.env.SMTP_USER ?? import.meta.env.SMTP_USER;
  const pass = process.env.SMTP_PASS ?? import.meta.env.SMTP_PASS;
  const secure = String(portRaw) === '465';

  if (!host || !user || !pass) {
    return null;
  }

  return { host, port, user, pass, secure };
}

function getFromAddress() {
  return (
    process.env.MAIL_FROM ??
    import.meta.env.MAIL_FROM ??
    process.env.SMTP_USER ??
    import.meta.env.SMTP_USER ??
    'no-reply@spornerede.net'
  );
}

export function isMailEnabled() {
  return Boolean(getSmtpConfig()) && hasDatabaseUrl();
}

export async function sendDirectMail(input: {
  toEmail: string;
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: Array<{ filename: string; path?: string; cid?: string; content?: any }>;
}) {
  const smtp = getSmtpConfig();
  if (!smtp) {
    throw new Error('SMTP ayarları eksik. Lütfen .env dosyasında SMTP_HOST, SMTP_USER ve SMTP_PASS ayarlarını kontrol edin.');
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
  });

  const attachments = [...(input.attachments || [])];
  const logoPath = path.resolve(process.cwd(), 'public/logo-email.png');
  if (input.html.includes('cid:spornerede-logo') && fs.existsSync(logoPath)) {
    attachments.push({
      filename: 'logo-email.png',
      path: logoPath,
      cid: 'spornerede-logo',
    });
  }

  return await transporter.sendMail({
    from: `"SporNerede.net" <${getFromAddress()}>`,
    to: input.toEmail,
    subject: input.subject,
    html: input.html,
    replyTo: input.replyTo || undefined,
    attachments,
  });
}

export async function enqueueMail(input: QueueMailInput) {
  if (!hasDatabaseUrl()) {
    return null;
  }

  const db = await getDb();
  return db.collection('mail_kuyrugu').create({
    legacyId: Date.now(),
    kind: input.kind,
    toEmail: input.toEmail,
    subject: input.subject,
    html: input.html,
    replyTo: input.replyTo ?? '',
    status: MAIL_STATUS_PENDING,
    attemptCount: 0,
    nextAttemptAt: new Date().toISOString(),
  });
}

async function sendQueuedMail(record: QueuedRecord) {
  await sendDirectMail({
    toEmail: record.toEmail,
    subject: record.subject,
    html: record.html,
    replyTo: record.replyTo,
  });
}

function calculateNextAttempt(attemptCount: number) {
  const delayMinutes = Math.min(30, Math.max(1, attemptCount * 2));
  return new Date(Date.now() + delayMinutes * 60 * 1000).toISOString();
}

export async function processMailQueue(limit = 5) {
  if (!hasDatabaseUrl()) {
    return { processed: 0, sent: 0, failed: 0 };
  }

  const db = await getDb();
  const nowIso = new Date().toISOString();
  const records = await db.collection('mail_kuyrugu').getFullList({ batch: 100 });
  const dueItems = records
    .map((record) => record as unknown as QueuedRecord)
    .filter((record) => {
      if (record.status !== MAIL_STATUS_PENDING) return false;
      if (!record.nextAttemptAt) return true;
      return new Date(record.nextAttemptAt).getTime() <= Date.now();
    })
    .sort((a, b) => String(a.created ?? '').localeCompare(String(b.created ?? '')))
    .slice(0, limit);

  let sent = 0;
  let failed = 0;

  for (const item of dueItems) {
    const attemptCount = Number(item.attemptCount ?? 0) + 1;

    try {
      await sendQueuedMail(item);
      await db.collection('mail_kuyrugu').update(item.id, {
        status: MAIL_STATUS_SENT,
        attemptCount,
        sentAt: new Date().toISOString(),
        lastError: '',
      });
      sent += 1;
    } catch (error) {
      const finalFailure = attemptCount >= MAX_RETRY;
      await db.collection('mail_kuyrugu').update(item.id, {
        status: finalFailure ? MAIL_STATUS_FAILED : MAIL_STATUS_PENDING,
        attemptCount,
        lastError: error instanceof Error ? error.message.slice(0, 1000) : 'Bilinmeyen hata',
        nextAttemptAt: finalFailure ? nowIso : calculateNextAttempt(attemptCount),
      });
      failed += 1;
    }
  }

  return { processed: dueItems.length, sent, failed };
}
