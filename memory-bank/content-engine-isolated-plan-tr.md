# Content Engine — İzole Sistem Planı

> Ana site koduna dokunmadan SEO/rehber taslak üretimi. Klasör: `content-engine/`

## Mimari

```
spornerede.net/
  src/              ← Astro site (Faz 20’de minimal /rehber/ eklenir)
  scripts/          ← Mevcut pb-setup, deploy (degistirilmez)
  content-engine/   ← YENI: otopilot, OpenRouter, PB yazma
    .env            ← Sadece burada (GIT disi)
    src/jobs/       ← keyword-engine, content-pipeline
    seed/           ← seed-keywords-tr.json
    prompts/
```

**Entegrasyon sınırı:** Content Engine yalnızca PocketBase REST/admin API. Canlı site PB’den okur; engine yazar.

| Koleksiyon | Kim yazar | Kim okur (site) |
|------------|-----------|-----------------|
| `seo_keywords` | content-engine | (ileride admin) |
| `rehber_yazilari` | content-engine | `/rehber/[slug]` (Faz 20) |
| `haberler` | Mevcut admin | `/haberler` — **otopilot dokunmaz** |

Haber akışı ayrı kalır. Onaylanan rehber ileride manuel veya script ile `haberler`’e aktarılabilir (opsiyonel, MVP dışı).

## Sizin hazırlık sırası

| # | Siz | Sonra (biz) |
|---|-----|-------------|
| **1** | OpenRouter key + modeller: `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` (birincil), `deepseek/deepseek-v4-flash:free` (yedek) | `job:draft` hazir |
| **2** | PB admin (lokal veya canlı URL) | `setup:collections` |
| **3** | `content-engine/.env` | `check:env` yeşil |
| **4** | `npm run setup:collections` + `seed:keywords` | keyword-engine + GSC |
| **5** | GSC service account JSON (opsiyonel) | `job:keywords` GSC sync |
| **6** | — | Site: `/rehber/` minimal sayfalar (Faz 20) |

## Kök komutlar (ana package.json)

```bash
npm run content-engine:install
npm run content-engine:check
```

## İlişkili planlar

- `memory-bank/seo-autopilot-plan-tr.md` — iş kuralları, OpenRouter birincil
- `memory-bank/faz-gelistirme-checklist-tr.md` — Faz 18–21
