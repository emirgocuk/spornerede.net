# Content Engine (izole SEO / rehber otopilot)

Ana site (`src/`, Astro sayfaları) **dokunulmadan** çalışır. Bu klasör:

- PocketBase’e yalnızca **API** ile yazar (`seo_keywords`, `rehber_yazilari`)
- OpenRouter `:free` ile taslak üretir
- Yayın öncesi içerik **admin onaylı** (`durum: incelemede`)

Canlı sitede `/rehber/` sayfaları ayrı bir fazda, ince entegrasyonla eklenecek.

## Kurulum (siz — sırayla)

### Adım 1 — OpenRouter (şimdi)

1. https://openrouter.ai → hesap açın
2. **Ödeme yöntemi eklemeyin** (fatura sızıntısı önlemi)
3. Keys → **Create API Key** → kopyalayın
4. Models → `:free` filtre → bir model seçin (ör. Qwen / Llama 70B)
5. Playground’da kısa Türkçe test: *"İstanbul voleybol kursu rehberi, 2 paragraf"*
6. Varsayılan modeller (`.env.example` ile aynı):
   - Birincil: [Nemotron 3 Nano Omni (free)](https://openrouter.ai/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free)
   - Yedek: `deepseek/deepseek-v4-flash:free`

### Adım 2 — PocketBase erişimi

Lokal veya canlı PB URL + admin:

- Lokal: `http://127.0.0.1:8090` (`npm run pb:start`)
- Canlı: sunucudaki PocketBase URL (VPN/SSH tüneli gerekebilir)

`POCKETBASE_URL`, `POCKETBASE_ADMIN_EMAIL`, `POCKETBASE_ADMIN_PASSWORD`

### Adım 3 — `.env` dosyası

```bash
cd content-engine
copy .env.example .env    # Windows
```

Doldurun (anahtari repoya koymayin):

```env
OPENROUTER_API_KEY=sk-or-v1-...
POCKETBASE_URL=http://127.0.0.1:8090
POCKETBASE_ADMIN_EMAIL=...    # ana proje .env ile ayni
POCKETBASE_ADMIN_PASSWORD=...
SEO_OPENROUTER_MODEL=nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free
SEO_OPENROUTER_MODEL_FALLBACK=deepseek/deepseek-v4-flash:free
```

```bash
npm install
npm run check:env
npm run job:draft           # 1 taslak (PB koleksiyonlari hazir olmali)
```

### Adım 4 — Koleksiyonlar (bir kez)

```bash
npm run setup:collections
```

`seo_keywords` ve `rehber_yazilari` PocketBase’de oluşur. Ana `scripts/pb-setup.ts` değiştirilmez.

### Adım 5 — GSC (sonra, opsiyonel Faz 18)

Search Console → site property → Service Account JSON.  
Adım 1–4 bitmeden zorunlu değil.

---

## Komutlar

| Komut | Açıklama |
|--------|----------|
| `npm run check:env` | Anahtarlar ve PB bağlantısı |
| `npm run setup:collections` | PB şema (izole script) |
| `npm run seed:keywords` | Seed keyword kuyruğu |
| `npm run job:keywords` | GSC + seed → skor (Faz 18) |
| `npm run job:draft` | 1 taslak üret (Faz 19) |
| `npm run list:drafts` | Bekleyen taslaklar |
| `npm run publish:draft -- <slug>` | Taslagi yayina al (lokal /rehber) |
| `npm run job:keywords` | GSC + skor guncelle (GSC JSON gerekli) |
| `npm run job:gsc` | Yayindaki makalelere GSC metrikleri |

Plan: `memory-bank/content-engine-isolated-plan-tr.md`
