# Server Operations Guide (English)

This guide defines what must be done on the server side for reliable production releases.

## 1) One-time Provisioning

- Install Node.js 22+.
- Install and configure PostgreSQL.
- Install and configure Nginx as reverse proxy.
- Create release structure:
  - `/opt/spornerede/releases`
  - `/opt/spornerede/current` (managed symlink)
- Create runtime env file:
  - `/opt/spornerede/.env`
- Register and enable service:
  - `/etc/systemd/system/spornerede.service`
  - `systemctl daemon-reload`
  - `systemctl enable --now spornerede`

## 2) Required Runtime Environment

Set and maintain at least:

- `DATABASE_URL`
- `SITE_URL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `MAIL_TO`
- `ADMIN_TOKEN`
- `PORT` (default app target expected by Nginx proxy)

## 3) Release Pipeline Expectations

- Every push to `main` should trigger GitHub workflow deploy.
- Deploy must run:
  1. `release:gate`
  2. `deploy.sh`
  3. `smoke:check` (if `SITE_URL` configured)
- Do not bypass failed gate/smoke checks in normal operation.

## 4) Operational Commands

- Health endpoint (basic): `GET /api/health`
- Health endpoint (deep): `GET /api/health?deep=1`
- Manual deploy (fallback): `bash deploy.sh --ssh user@host`
- Rollback: `bash rollback.sh`
- Service status: `systemctl status spornerede`
- Logs: `journalctl -u spornerede -n 200 --no-pager`

## 5) Security & Access

- Prefer key-based SSH access only.
- Restrict SSH users and disable password login where possible.
- Keep `.env` server-local only (never committed).
- Rotate admin token and SMTP credentials periodically.

## 6) Backup & Recovery Minimum

- Daily PostgreSQL backup.
- Keep retention policy (example: 7 local + offsite weekly).
- Test restore procedure periodically.
- Validate app health after restore with `/api/health?deep=1`.

## 7) Change Discipline

- Infra changes should be documented in `memory-bank/deploy-runbook.md`.
- Any production incident must record:
  - timestamp
  - impact
  - rollback action
  - permanent fix