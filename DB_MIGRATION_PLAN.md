# DB Migration Plan

This project now includes Drizzle schema definitions for:

- `iller`
- `ilceler`
- `branslar`
- `kulupler`
- `kulup_branslar`
- `uyelik_paketleri`
- `kulup_uyelikleri`

## Migration Steps

1. Set `DATABASE_URL` in `.env`.
2. Generate migrations:
   - `npm run db:generate`
3. Apply migrations:
   - `npm run db:migrate`
4. Insert bootstrap data:
   - cities (`iller`)
   - districts (`ilceler`)
   - branches (`branslar`)
   - membership plans (`uyelik_paketleri`)

## Fallback Behavior

If `DATABASE_URL` is missing, repository layer falls back to mock data from `src/data/mockData.ts`.
This keeps the app running in development until DB is ready.

