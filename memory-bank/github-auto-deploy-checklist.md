# SporNerede.net — GitHub Auto Deploy Checklist (Active Guide)

Use this checklist to enable and verify automatic production deploys from GitHub.
Mark each item as done when completed.

## Goal

- Every push to `main` triggers an automatic deploy to the production server.
- Deploy flow includes pre-checks, deploy, and post-deploy smoke checks.
- Rollback path is ready if a bad release occurs.

## 1) Server Prerequisites (One-time)

- Node.js 22+ is installed on the server.
- Target directories exist:
  - `/opt/spornerede/releases`
  - `/opt/spornerede/current` (symlink managed by deploy script)
- Service file exists and is enabled:
  - `/etc/systemd/system/spornerede.service`
  - `systemctl enable --now spornerede` completed
- Runtime env file exists: `/opt/spornerede/.env`
- Nginx reverse proxy is configured to app port (default 3000).

## 2) SSH Access for GitHub Actions (One-time)

- Create a dedicated deploy SSH keypair (recommended: ed25519).
- Add the public key to server authorized keys for deploy user.
- Confirm SSH login works without password from a trusted machine.
- Record deploy target format: `user@server_ip` (for `DEPLOY_SSH`).

## 3) GitHub Repository Settings (One-time)

Go to: **GitHub -> Settings -> Secrets and variables -> Actions**

### Required Secrets

- `DEPLOY_SSH` = `user@server_ip`
- `DEPLOY_SSH_KEY` = private SSH key content
- `DEPLOY_SSH_HOST` = server host/IP only (example: `1.2.3.4`)

### Recommended Variables

- `SITE_URL` = `https://spornerede.net`
- `REMOTE_BASE` = `/opt/spornerede` (or your custom base path)
- `SYSTEMD_UNIT` = `spornerede`
- `UPDATE_NGINX` = `0` (set `1` only when nginx config update is intended)

## 4) Workflow Expectations

Workflow file: `.github/workflows/deploy.yml`

Expected pipeline order:

- Checkout repository
- Setup Node 22
- Prepare SSH key and known_hosts
- Run `npm run release:gate`
- Run deploy script (`bash deploy.sh --ssh ...`)
- Run `npm run smoke:check` (when `SITE_URL` is set)

## 5) First Live Validation

- Push a small safe commit to `main`.
- Open GitHub Actions and confirm deploy workflow starts.
- Confirm `release:gate` step passes.
- Confirm deploy step passes.
- Confirm smoke check step passes.
- Verify routes manually:
  - `/`
  - `/ara`
  - `/basvuru`
  - `/api/health?deep=1`

## 6) Failure Playbook

- If workflow fails, inspect the failed job step logs first.
- If production is unhealthy after deploy, run rollback:
  - `bash rollback.sh` (or `npm run rollback:remote`)
- Re-verify health endpoints and key routes after rollback.
- Add an incident note in `memory-bank/deploy-runbook.md` format.

## 7) Operating Principles (Self-hosted First)

- Keep core runtime self-hosted: Node app + PostgreSQL + Nginx + systemd.
- Minimize external services to required-only integrations.
- Make deploy quality measurable: gate + smoke + health checks on every release.
- Never skip rollback readiness.

## Done Criteria

- A push to `main` updates production without manual SSH deploy steps.
- Health and smoke checks pass automatically.
- Rollback has been tested at least once.