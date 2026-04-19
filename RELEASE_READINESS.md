# Release Readiness

## Environment
- `DATABASE_URL` configured
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_TO` configured
- `ADMIN_TOKEN` configured

## Build & Runtime
- `npm run build` passes
- `/api/health` returns `status: ok`
- `/api/metrics` returns active counts
- `/api/basvuru` accepts valid form payload

## SEO
- `robots.txt` includes:
  - `sitemap-index.xml`
  - `sitemaps/cities.xml`
  - `sitemaps/districts.xml`
- Dynamic pages:
  - `/sehirler/[il]/[brans]`
  - `/sehirler/[il]/[ilce]/[brans]`

## Admin
- `/admin` page loads summary
- `/api/admin/applications` is protected by `ADMIN_TOKEN`

## Deployment
- Deploy server build output (`dist/`)
- Restart service and verify health endpoint
- Monitor first 24h:
  - request errors
  - form submission failures
  - DB connection errors

