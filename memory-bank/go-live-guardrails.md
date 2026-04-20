# Go-Live Guardrails (EN)

Use this file as the minimum safety policy before exposing new features to real users.

## 1) Release Gate Policy

- Every production release must pass:
  - `npm run release:gate`
  - deploy pipeline
  - `npm run smoke:check`
- No manual override for failed smoke checks unless rollback is already in progress.

## 2) Access Control Policy

- Panel endpoints must require authenticated sessions and role checks.
- Club users must be scoped to their own club resources only.
- Admin operations must require either:
  - valid admin session role, or
  - explicit admin token (for controlled operational access).

## 3) Data Safety Policy

- Database schema changes only via migrations.
- Never hot-edit production schema manually.
- Demo seeds and operational scripts must be idempotent or clearly documented as destructive.

## 4) Observability Policy

- `GET /api/health` and `GET /api/health?deep=1` must be available.
- Track key metrics in `/api/metrics`:
  - `activeClubCount`
  - `clubsWithPrograms`
  - `cityCoverageCount`
  - `branchCount`

## 5) Rollback Policy

- Rollback command must remain available and tested:
  - `npm run rollback:remote` (or `bash rollback.sh`)
- In incident response:
  1. stop bad rollout
  2. rollback
  3. verify health + smoke routes
  4. document incident note and fix plan

## 6) Launch Readiness Policy

- Before onboarding external testers or customers:
  - run `demo:seed`
  - validate panel/admin/public flows end-to-end
  - confirm mail + DB + health checks
  - verify no blocker-level UI defects on core routes