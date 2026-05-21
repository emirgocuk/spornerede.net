import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { cfg } from '../config.js';

export const GSC_READONLY_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';

type ServiceAccountKeys = { client_email: string; private_key: string };

type OAuthClientFile = {
  installed?: { client_id: string; client_secret: string; redirect_uris?: string[] };
  web?: { client_id: string; client_secret: string; redirect_uris?: string[] };
};

type OAuthTokenFile = {
  refresh_token?: string;
  access_token?: string;
  expiry_date?: number;
  token_type?: string;
  scope?: string;
};

function abs(rel: string) {
  return resolve(cfg.contentEngineRoot, rel);
}

function readJson<T>(relPath: string): T {
  return JSON.parse(readFileSync(abs(relPath), 'utf8')) as T;
}

function parseOAuthClient(raw: OAuthClientFile) {
  const block = raw.installed ?? raw.web;
  if (!block?.client_id || !block?.client_secret) {
    throw new Error('OAuth client JSON: installed veya web.client_id/secret eksik');
  }
  return { clientId: block.client_id, clientSecret: block.client_secret };
}

export function gscAuthConfigured(): boolean {
  if (cfg.gscAuthMode === 'oauth') {
    return Boolean(cfg.gscOAuthClientPath && cfg.gscOAuthTokenPath);
  }
  return Boolean(cfg.gscServiceAccountPath);
}

/** Service account veya OAuth ile GoogleAuth / OAuth2Client */
export async function getGscAuthClient() {
  const { google } = await import('googleapis');

  if (cfg.gscAuthMode === 'oauth') {
    if (!cfg.gscOAuthClientPath || !cfg.gscOAuthTokenPath) {
      return null;
    }
    const { clientId, clientSecret } = parseOAuthClient(
      readJson<OAuthClientFile>(cfg.gscOAuthClientPath),
    );
    const tokens = readJson<OAuthTokenFile>(cfg.gscOAuthTokenPath);
    const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
    oauth2.setCredentials(tokens);
    return oauth2;
  }

  if (!cfg.gscServiceAccountPath) return null;
  const keys = readJson<ServiceAccountKeys>(cfg.gscServiceAccountPath);
  return new google.auth.GoogleAuth({
    credentials: keys,
    scopes: [GSC_READONLY_SCOPE],
  });
}

export function saveOAuthToken(relPath: string, tokens: OAuthTokenFile) {
  writeFileSync(abs(relPath), `${JSON.stringify(tokens, null, 2)}\n`, 'utf8');
}

export function oauthTokenExists(): boolean {
  return Boolean(cfg.gscOAuthTokenPath && existsSync(abs(cfg.gscOAuthTokenPath)));
}

export function getServiceAccountEmail(): string | null {
  if (!cfg.gscServiceAccountPath) return null;
  try {
    const keys = readJson<ServiceAccountKeys>(cfg.gscServiceAccountPath);
    return keys.client_email ?? null;
  } catch {
    return null;
  }
}
