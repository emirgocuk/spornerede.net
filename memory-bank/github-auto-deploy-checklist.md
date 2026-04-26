# SporNerede.net — Server Pull Auto Deploy Checklist (Active Guide)

Use this checklist to enable and verify automatic production deploys with a server-side Git pull timer.
Mark each item as done when completed.

## Goal

- Every push to `main` is picked up by the production server timer.
- Deploy flow includes pre-checks, deploy, and post-deploy smoke checks.
- Rollback path is ready if a bad release occurs.

## 1) Server Prerequisites (One-time)

- Node.js 22+ is installed on the server.
- Git and rsync are installed on the server.
- PocketBase is installed as `spornerede-pocketbase`.
- Target directories exist:
  - `/opt/spornerede/releases`
  - `/opt/spornerede/current` (symlink managed by deploy script)
- Service file exists and is enabled:
  - `/etc/systemd/system/spornerede.service`
  - `systemctl enable --now spornerede` completed
- Runtime env file exists: `/opt/spornerede/.env`
- Nginx reverse proxy is configured to app port (default 3000).

## 2) GitHub Deploy Key for Server Pull (One-time)

- A dedicated ed25519 deploy key was created on the production server.
- Add this public key to the GitHub repo as a read-only deploy key:

```text
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIKVpmouLvpxNyzPl4uR0z1nAN5Fnv9I4snMKmkwikbr2 spornerede-prod-deploy
```

- GitHub path:
  - Repository `Settings`
  - `Deploy keys`
  - `Add deploy key`
  - `Allow write access`: off
- After adding it, verify from the server:

```bash
ssh -T git@github.com
```

Expected result is an authentication success message for GitHub. A publickey permission error means the deploy key is not active yet.

## 3) Server Repo Clone (One-time)

After the deploy key is active:

```bash
git clone git@github.com:emirgocuk/spornerede.net.git /opt/spornerede/repo
cd /opt/spornerede/repo
git status
```

Repo must stay clean. If `git status --porcelain` returns anything, auto-update intentionally skips deployment.

## 4) systemd Timer Expectations

Files:

- `/etc/systemd/system/spornerede-autoupdate.service`
- `/etc/systemd/system/spornerede-autoupdate.timer`

Expected service order:

- `git fetch`
- `git pull --ff-only`
- `npm ci`
- `npm run release:gate`
- `npm run build`
- `npm run pb:setup`
- create timestamped release
- copy `dist/`, `package.json`, `package-lock.json`
- run `npm ci --omit=dev` inside release
- update `/opt/spornerede/current`
- restart `spornerede`
- run `npm run smoke:check`

Enable and test:

```bash
systemctl daemon-reload
systemctl enable --now spornerede-autoupdate.timer
systemctl start spornerede-autoupdate.service
journalctl -u spornerede-autoupdate.service -n 100 --no-pager
```

## 5) First Live Validation

- Push a small safe commit to `main`.
- Confirm the server timer sees the new commit.
- Confirm `release:gate`, build, `pb:setup`, service restart, and smoke check pass in journal logs.
- Verify routes manually:
  - `/`
  - `/ara`
  - `/basvuru`
  - `/api/health?deep=1`

## 6) Failure Playbook

- If timer deploy fails, inspect:
  - `journalctl -u spornerede-autoupdate.service -n 200 --no-pager`
  - `journalctl -u spornerede -n 200 --no-pager`
- If production is unhealthy after deploy, run rollback:
  - `bash rollback.sh` (or `npm run rollback:remote`)
- Re-verify health endpoints and key routes after rollback.
- Add an incident note in `memory-bank/deploy-runbook.md` format.

## 7) Operating Principles (Self-hosted First)

- Keep core runtime self-hosted: Node app + PocketBase + Nginx + systemd.
- Minimize external services to required-only integrations.
- Make deploy quality measurable: gate + smoke + health checks on every release.
- Never skip rollback readiness.

## Done Criteria

- A push to `main` updates production through the server timer without manual release upload.
- Health and smoke checks pass automatically.
- Rollback has been tested at least once.