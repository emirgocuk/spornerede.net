# Server Operations Guide

This guide defines what must be done on the server side for reliable production releases.

## 1) One-time Provisioning

- Install Node.js 22+.
- Install and configure PocketBase as a local systemd service.
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
- Register and enable PocketBase:
  - `/etc/systemd/system/spornerede-pocketbase.service`
  - data directory: `/opt/spornerede/pocketbase/pb_data`
  - public/uploads directory: `/opt/spornerede/pocketbase/pb_public`
- Register and enable backup timer:
  - `/etc/systemd/system/spornerede-backup.service`
  - `/etc/systemd/system/spornerede-backup.timer`

## 2) Required Runtime Environment

Set and maintain at least in `/opt/spornerede/.env`:

- `SITE_URL`
- `PORT`
- `HOST`
- `POCKETBASE_URL`
- `POCKETBASE_ADMIN_EMAIL`
- `POCKETBASE_ADMIN_PASSWORD`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `MAIL_FROM`
- `MAIL_TO`
- `MAIL_QUEUE_TOKEN`
- `ADMIN_TOKEN`
- `IMGBB_API_KEY`
- `OFFSITE_BACKUP_TARGET` (optional but recommended)

## 3) Release Pipeline Expectations

- GitHub Actions deploy is intentionally disabled.
- Target model is server-side pull via `spornerede-autoupdate.timer`.
- A new release must run:
  1. `git pull --ff-only`
  2. `npm ci`
  3. `npm run release:gate`
  4. `npm run build`
  5. `npm run pb:setup`
  6. copy `dist/`, `package.json`, `package-lock.json` into a timestamped release
  7. run `npm ci --omit=dev` inside the release
  8. update `/opt/spornerede/current`
  9. `systemctl restart spornerede`
  10. `npm run smoke:check`
- Do not bypass failed gate/smoke checks in normal operation.

Current blocker for full automatic pull deploy:

- The GitHub repository is private.
- Add this read-only deploy key under repo `Settings > Deploy keys`:

```text
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIKVpmouLvpxNyzPl4uR0z1nAN5Fnv9I4snMKmkwikbr2 spornerede-prod-deploy
```

After key activation:

```bash
git clone git@github.com:emirgocuk/spornerede.net.git /opt/spornerede/repo
systemctl enable --now spornerede-autoupdate.timer
systemctl start spornerede-autoupdate.service
```

## 4) Operational Commands

- Health endpoint (basic): `GET /api/health`
- Health endpoint (deep): `GET /api/health?deep=1`
- Manual deploy (fallback): `bash deploy.sh --ssh user@host`
- Rollback: `bash rollback.sh`
- Service status: `systemctl status spornerede`
- Logs: `journalctl -u spornerede -n 200 --no-pager`
- PocketBase status: `systemctl status spornerede-pocketbase --no-pager`
- Backup status: `systemctl status spornerede-backup.timer --no-pager`
- Manual backup: `systemctl start spornerede-backup.service`

## 5) Security & Access

- Prefer key-based SSH access only.
- Restrict SSH users and disable password login where possible.
- Keep `.env` server-local only (never committed).
- Rotate admin token and SMTP credentials periodically.

## 6) Backup & Recovery Minimum

- Daily backup via `spornerede-backup.timer`.
- Backup includes:
  - `/opt/spornerede/.env`
  - `/opt/spornerede/pocketbase/pb_data`
  - `/opt/spornerede/pocketbase/pb_public`
- Admin manual backup download is available from the `Yedekler` tab.
  - It includes only `pb_data` and `pb_public`.
  - It intentionally excludes `.env` and secrets.
- Keep retention policy:
  - 7 days local
  - 30 days offsite when `OFFSITE_BACKUP_TARGET` is configured
- Test restore procedure periodically.
- Validate app health after restore with `/api/health?deep=1`.

## 7) Current Production Notes

- Production server: `root@45.155.19.82`
- Node version after provisioning: `v22.22.2`
- First live smoke check passed for `/`, `/ara`, `/basvuru`, `/api/health?deep=1`.
- `/api/health?deep=1` reports `ok` after Brevo SMTP configuration.
- Live mail queue test passed with `processed:1`, `sent:1`, `failed:0`.
- Admin manual backup endpoint tested successfully; archive contained `pb_data/` and `pb_public/`.
- Production secrets are stored only on the server:
  - `/opt/spornerede/.env`
  - `/opt/spornerede/production-credentials.txt`

## 8) Change Discipline

- Infra changes should be documented in `memory-bank/deploy-runbook.md`.
- Any production incident must record:
  - timestamp
  - impact
  - rollback action
  - permanent fix