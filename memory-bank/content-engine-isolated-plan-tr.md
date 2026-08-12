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
| `rehber_yazilari` | content-engine (manuel) | `/rehber/[slug]` (Faz 20 — **otomasyon ertelendi**) |
| `haberler` | admin + content-engine (günlük otopilot) | `/haberler` — **günde 1 otomatik + haftalık CTR rewrite** |

Haber akışı: günlük otomatik üretim + GSC tabanlı seçici rewrite (haftada max 2). **CE-5–CE-8 ✅ (2026-05-31).** Operasyon düzeltmeleri **2026-06-14** (scheduler pick, `sehir_brans` policy, 504 timeout). Rehber otomasyonu **ertelendi**.

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

## İçerik Özgünlüğü — Basma Kalıp Giderme Planı (MVP)

> Sorun: Üretilen haber/rehber metinleri yapısal ve cümlesel olarak birbirinin klonu ("basma kalıp"). Aşağıdaki plan, mevcut `content-engine/` koduna göre dosya bazında somutlaştırılmıştır. Faz numaraları otopilot Faz 18–21 ile karışmasın diye **Ö (Özgünlük)** ön ekiyle verilmiştir.

### Başarı ölçütü
- Son 20 yayın arası trigram (3-kelime) Jaccard benzerliği ortalaması **< 0.25**.
- Her metinde en az **3 somut, konuya özel veri** (gerçek kulüp adı / semt / yaş grubu / gün).
- Aynı dolgu paragrafının iki ayrı metinde birebir tekrar oranı **%0**.

### Kök neden (kanıtlı)
| # | Neden | Kanıt (dosya) |
|---|-------|---------------|
| KN-1 | Modele gerçek veri verilmiyor; yalnızca sayım geçiliyor | `src/lib/site-context.ts` (kulüp/program sayısı) |
| KN-2 | Sabit dolgu paragrafı koda gömülü; birden çok metne aynen giriyor | `src/lib/news-draft-quality.ts` → `ensureMinNewsWords` |
| KN-3 | Zorunlu tek-tip h2 iskeleti + "Kayıt ve kayıt süreci" dayatması | `prompts/news-quality-rules.txt`, `prompts/news-rewrite.txt`, `assessNewsDraft` |
| KN-4 | Konu uzayı "şehir+branş+kursu" klonları | `seed/seed-keywords-tr.json` |
| KN-5 | 8 sabit açı + zayıf ücretsiz model + temp 0.65 | `src/lib/news-angles.ts`, `src/llm/generate-news.ts` |

### Faz Ö1 — MVP (kritik %80 kazanç) — ✅ uygulandı (2026-05-31)

> Uygulama özeti: `site-context.ts` → `buildNewsRealData`; `news-draft-runner.ts` LLM pipeline'a `realData` bağlandı; `generate-news.ts` + `news-base.txt` `{{REAL_DATA}}` bloğu; `ensureMinNewsWords` varyantlı dolgu; prompt'larda sabit iskelet/zorunlu kayıt h2 gevşetildi. Detay: `activeContext.md`.


1. **Data-grounding (KN-1, en yüksek öncelik).** Üretim öncesi PB'den konuyla eşleşen 3-5 gerçek `kulupler`/`programlar` kaydını (ad, semt/ilçe, branş, yaş, gün/saat — PII'siz) çek; prompt'a `{{REAL_DATA}}` bloğu ile ver, "yalnızca bu verilerden somut yaz, eksiği uydurma" talimatı ekle.
   - Dokunulacak: `src/lib/site-context.ts` (`buildSiteContext` genişlet), `prompts/news-base.txt` (yeni blok), `src/llm/generate-news.ts` (`buildNewsPrompt` + `NewsGenerationContext`), çağıranlar: `src/jobs/news-draft-runner.ts`, `src/jobs/complete-news-runner.ts`, `src/pages/api/admin/content-engine/*.ts`.
2. **Gömülü dolgu paragrafını kaldır (KN-2).** `ensureMinNewsWords` içindeki sabit "Pratik öneriler" paragrafını kaldır; kelime eşiği tutmazsa metni "eksik" sayıp yeniden üretime gönder (tercih) veya bloğu `realData`'dan dinamik üret.
   - Dokunulacak: `src/lib/news-draft-quality.ts` ve çağıranları (`build-template-news.ts`, `enrich-news.ts`).
3. **İskeleti gevşet (KN-3).** Sabit h2 sayısı ve zorunlu "Kayıt ve kayıt süreci" başlığını öneriye çevir; yalnızca gerçek kalite zorunlu kalsın (min kelime, geçerli HTML, CTA, tam biten son cümle). `assessNewsDraft`'tan h2/kayıt zorunluluğunu yumuşat.
   - Dokunulacak: `prompts/news-quality-rules.txt`, `prompts/news-base.txt`, `prompts/news-rewrite.txt`, `src/lib/news-draft-quality.ts`.
   - **Not:** Ö1.3 ideal olarak Ö2.2 (dedup gate) ile birlikte; gevşeyen kapı zayıf modelde bozuk çıktı riskini artırır, `repairNewsHtml` korunmalı.

### Faz Ö2 — Çeşitlilik ve otomatik kontrol — ✅ uygulandı (2026-05-31)

> Uygulama: `src/lib/similarity.ts` (trigram Jaccard) + `published-topics.ts` → `loadRecentPublishedBodies`; `news-draft-runner.ts` LLM pipeline'ına dedup gate (eşik aşılırsa alternatif açıyla 1 yeniden üretim, hâlâ benzerse otomatik yayın yok → incelemeye düşer). `news-angles.ts` açı havuzu 8 → 18 + `pickAlternativeAngle`. `config.ts` → `SEO_NEWS_TEMPERATURE` (0.8) + `SEO_NEWS_DEDUP_MAX` (0.45); `generate-news.ts` temperature'ı kullanıyor.


1. **İçerik tipi çeşitliliği (KN-5).** Tek "kurs tanıtımı" yerine tipler: karşılaştırma, maliyet rehberi, yaş-bazlı, SSS, sezon takvimi. Her tip kendi iskeleti. `news-angles.ts` → `content-types.ts`; tip seçimi `seed-keywords`'teki `niyet` (bilgi/işlem/yönlendirme) alanına bağlanır. Açı havuzu 8 → 20+; son kullanılan açı PB'de tutulup tekrar engellenir.
2. **Benzerlik kapısı / dedup gate (KN-3 destek).** Yeni `src/lib/similarity.ts` (trigram + Jaccard). Yayın öncesi yeni metni son N (örn. 20) yayınla karşılaştır; eşik (> 0.30) üstüyse RETRY_HINT ile yeniden üret, 2 denemede de geçemezse "incelemeye düşür" (pasif taslak). `news-draft-runner.ts` / `complete-news-runner.ts` akışına entegre.
3. **Model / sampling.** `SEO_OPENROUTER_MODEL` için küçük ücretli model ile A/B; `config.ts`'e `SEO_NEWS_TEMPERATURE` ekle (data-grounding aktifken 0.65 → 0.8).

### Faz Ö3 — ✅ kısmen uygulandı (content-engine kapsamı) (2026-05-31)
- ✅ **İç link genişletme:** `buildNewsInternalLinksHtml` `parseKonu` ile tüm branş + şehir + şehir/branş hub linkleri üretiyor.
- ✅ **Rewrite/tamamla grounding:** `complete-news-runner.ts` → `buildNewsRealData` → `completeNewsBody → polishNewsHtml → rewriteNewsFull` boyunca `{{REAL_DATA}}`.
- ✅ **Editör onayı (mevcut):** auto-publish toggle + dedup "incelemeye düşürme" + admin haber taslağı düzenle/yayınla.
- ✅ **Tip temizliği:** content-engine `tsc --noEmit` temiz (exit 0).
- ⏭️ **Ana site Faz 20'ye ait (content-engine dışı):** Pillar + cluster `/rehber/` Astro sayfaları + admin "SEO İçerik" sekmesi.
- ⏭️ **Faz 21'e ait:** GSC tabanlı gerçek "People Also Ask" başlık/H2 (daha fazla GSC veri toplama gerekir).

### Faz Ö4 — GSC seçici haber rewrite — ✅ uygulandı (2026-05-31)

> Strateji: günde **1 yeni haber** + haftada **en fazla 2** düşük CTR rewrite (hacim değil kalite).

- **`job:news-rewrite`** (`content-engine/src/jobs/news-gsc-rewrite.ts`): Yayında (`aktif`) haberlerin GSC sayfa metriklerini okur; ≥50 gösterim + CTR <%3 (`SEO_GSC_LOW_CTR_*`) adayları gösterime göre sıralar; haftalık limit (`SEO_NEWS_REWRITE_MAX_PER_WEEK=2`), min yayın yaşı (`SEO_NEWS_REWRITE_MIN_PUBLISH_WEEKS=2`) ve aynı habere tekrar rewrite aralığı (`SEO_NEWS_REWRITE_MIN_WEEKS=2`, `<!-- ce-rewrite:ISO -->` yorumu) uygular.
- **Rewrite:** `rewriteNewsFull` → başlık/meta/gövde; data-grounding (`buildNewsRealData`); dedup gate (`SEO_NEWS_DEDUP_MAX`); kalite kapısı (`assessNewsDraft`).
- **Zamanlayıcı:** Astro `newsScheduler.ts` — **Pazartesi 04:10 TR** (keyword sync 04:00 sonrası); `content_engine_schedule.lastNewsRewriteAt/Message`; admin zamanlayıcı kartında durum satırı.
- **Komutlar:** `npm run content-engine:news-rewrite` (canlı); `--dry-run` aday listesi.
- **PB:** `haberler` koleksiyonuna opsiyonel `gsc_*` alanları (`pb-setup`); schedule kaydına `lastNewsRewrite*` alanları.

### Önerilen uygulama sırası (Ö1–Ö4 — tamamlandı)
Ö1.2 (dolgu kaldır) → Ö1.1 (data-grounding) → Ö2.2 (dedup gate, ölçüm) → Ö1.3 (iskelet gevşet) → Ö2.1 + Ö2.3 (çeşitlilik + model) → Ö4 (GSC CTR rewrite).

---

## Faz CE-5 → CE-8 — Haber otopilotu genişletmesi ✅ (2026-05-31)

> **Karar (2026-05-31):** Tek otomatik kanal **`haberler`**. Rehber (`rehber_yazilari`, `/rehber/`, `draft-runner`) ve görsel/video otomasyonu **bu plandan çıkarıldı** — ileride ayrı epik. Ana site Faz 20 rehber sayfaları content-engine ile karıştırılmaz.

### Strateji (tek cümle)
Günde 1 haber; konu **GSC + keyword kuyruğu** ile seçilsin; metin **gerçek site verisi + iç link + CTA** ile güçlensin; kalite **dedup + (opsiyonel) admin onay** ile korunsun.

### Kapsam tablosu

| Yetkinlik | Mevcut | CE fazı | Not |
|-----------|--------|---------|-----|
| Content calendar | `seo_keywords` + scheduler | **CE-5** | Takvim = kuyruk görünürlüğü + opsiyonel tarih |
| Auto linking | Footer hub linkleri | **CE-6** | Gövde: kulüp + ilgili haber |
| Auto research | GSC + `buildNewsRealData` + dedup | **CE-7** | SERP yok; GSC varyant + avoidList |
| Auto promotion | CTA + kalite kapısı | **CE-8** | Niyet → CTA şablonu |
| Görsel / video | CSS placeholder (site) | — | **Kapsam dışı** |
| Rehber / uzun form | Manuel admin | — | **Kapsam dışı** |

### Günlük akış (sadece haber)

```
Pazartesi 04:00  → keyword-engine (GSC skor)
Pazartesi 04:10  → news-gsc-rewrite (max 2/hafta)
Her gün HH:MM   → news-draft-runner
    → pickNewsKeyword / planlanan_tarih (CE-5)
    → research bundle: GSC + realData + avoidList + angle (CE-7)
    → LLM → kalite + dedup
    → inject links: footer + gövde kuralları (CE-6)
    → auto-publish veya taslak
```

**Sabit kurallar:** `SEO_DAILY_ARTICLE_LIMIT=1` · ücretsiz OpenRouter · rehber scheduler’a bağlanmaz.

### Faz CE-5 — Content calendar (içerik takvimi) — ✅ uygulandı (2026-05-31)

| Alt | Durum |
|-----|--------|
| CE-5a | Admin 14 gün tablo + kuyruk listesi |
| CE-5b | `seo_keywords.planlanan_tarih` + PATCH API |
| CE-5c | `seasonScoreBoost` keyword-engine'de |

### Faz CE-6 — Auto linking — ✅ uygulandı (2026-05-31)

| Alt | Durum |
|-----|--------|
| CE-6a | `Platformda örnek kulüpler` paragrafı (1–2 gerçek slug) |
| CE-6b | `İlgili haber:` bloğu (footer öncesi, tek link) |
| Footer | Mevcut `İlgili sayfalar` hub linkleri |

### Faz CE-7 — Auto research — ✅ uygulandı (2026-05-31)

| Alt | Durum |
|-----|--------|
| CE-7a | `gsc_query_variants` → `buildGscHintText` |
| CE-7b | `buildAvoidanceBrief` başlık tekrarı uyarısı |

### Faz CE-8 — Auto promotion — ✅ uygulandı (2026-05-31)

| Alt | Durum |
|-----|--------|
| CE-8 | `buildCtaHint(niyet)` → `{{CTA_HINT}}` prompt |

### Faz CE-5 — Content calendar (içerik takvimi) — spec (referans)

Takvim ayrı ürün değil; **`seo_keywords` kuyruğunun planlanmış sırası**.

| Alt | İş | PB / UI |
|-----|-----|---------|
| CE-5a | Admin: önümüzdeki 14 gün sıradaki N keyword (skor DESC) | Salt okunur liste |
| CE-5b | Opsiyonel `planlanan_tarih` — o gün sabit konu | `seo_keywords` alan |
| CE-5c | Sezon skor boost (Mayıs yaz, Ağustos okula dönüş) | `keyword-engine` iş kuralı |

**Seçim kuralı (spec):** `planlanan_tarih = bugün` varsa o kayıt; yoksa `pickNewsKeyword` (skor DESC, `sehir_brans` hariç, yayın dedup). Güncel uygulama: yukarıdaki **Operasyon düzeltmeleri (2026-06-14)**.

### Faz CE-6 — Auto linking (gövde derinliği)

Linkler **LLM’den değil, PB + `parseKonu` kurallarından**.

| Alt | İş |
|-----|-----|
| CE-6a | Gövde: 1–2 gerçek kulüp slug (`buildNewsRealData` kaynağı) |
| CE-6b | İlgili önceki haber (aynı branş/şehir, son 30 gün, max 1) |
| — | Footer hub linkleri mevcut; tekrar etme |
| — | Rehber çapraz link, dış federasyon URL — **ertelendi** |

### Faz CE-7 — Auto research (0 TL katman)

| Kaynak | Kullanım |
|--------|----------|
| GSC metrikleri | `gscHint`, skor, rewrite adayları |
| `buildNewsRealData` | Outline somutluğu |
| `avoidList` / son 20 yayın | Başlık/H2 tekrarı engeli |
| `news-angles` | 18 açı çeşitliliği |

| Alt | İş |
|-----|-----|
| CE-7a | Keyword için GSC top sorgu varyantlarını prompt’a 2–3 madde |
| CE-7b | Son yayın başlıklarından otomatik avoid trigram listesi |

**Ertelenen:** Serper / DataForSEO — trafik kanıtı sonrası ayrı karar (`SEO_USE_PAID_APIS`).

### Faz CE-8 — Auto promotion (CTA ince ayar)

| `niyet` | CTA |
|---------|-----|
| `islem` / `yonlendirme` | `/ara?…` (şehir/branş filtreli) |
| `bilgi` | Genel `/ara` |
| Her zaman | Son paragraf SporNerede; `assessNewsDraft` `hasCta` |

### Uygulama sırası ve efor

```
Temel (Ö1–Ö4) ✅ → CE-5 → CE-6 → CE-7 → CE-8 ✅
```

### Operasyon düzeltmeleri (2026-06-14) — ✅ uygulandı

| Sorun | Çözüm |
|-------|--------|
| Scheduler yalnızca en yüksek skorlu kelimeyi seçiyordu; yayın dedup yoktu | Astro `runScheduledNewsDraft` → `runNewsDraftAutoPick()` (content-engine `pickNewsKeyword`) |
| `sehir_brans` kategorisi haber kuyruğunu domine ediyordu | `news-keyword-policy.ts` — otomatik haberden hariç; `keyword-engine.ts` skor cezası |
| Duplicate konu → günlük üretim düşüyordu | `news-draft-runner.ts` — 5 deneme; yayınlanan keyword → `yazildi` |
| Admin “SEO haber yaz” 504 (LLM 1–3 dk) | Nginx `/api/admin/content-engine/` → 360s read timeout |
| Manuel taslak sonrası kuyruk ilerlemiyordu | `markKeywordWritten()` / `markKeywordUsedByAnahtar()` |
| Takvim “tahmini” satırları DB tarihi sanılıyordu | Admin UI açıklaması: önizleme ≠ `planlanan_tarih` |

**Canlı schedule:** `enabled: true`, `runHour: 10`, `runMinute: 0` (TR).

**Seçim kuralı (güncel):** `planlanan_tarih = bugün` varsa o kayıt; yoksa `pickNewsKeyword` (skor DESC, `sehir_brans` hariç, yayın dedup).

| Faz | Tahmini efor | Maliyet |
|-----|--------------|---------|
| CE-5 | 1–2 gün | 0 TL |
| CE-6 | 1–2 gün | 0 TL |
| CE-7 | ~1 gün | 0 TL |
| CE-8 | ~0.5 gün | 0 TL |

### Başarı ölçütleri (haber-only)

- Scheduler açıkken her gün 1 üretim; `enabled` kapanmıyor.
- Son 20 haber trigram benzerliği ort. **< 0.25** (mevcut hedef).
- CE-6 sonrası: yayınların **%80+** gövde içi kulüp veya ilgili haber linki.
- Auto-publish açıkken taslak düşme oranı **< %20** (dedup/kalite).

### Bilinçli yapılmayacaklar (bu epik)

- Günde birden fazla uzun makale veya rehber slotu.
- LLM’e serbest dış link.
- AI görsel, video embed, OG otomasyonu (ayrı epik).
- Soro SaaS entegrasyonu — mevcut `content-engine/` genişletilir.

### Riskler / açık sorular
- **PB şeması:** `kulupler`/`programlar` alan adları ve yayına uygun (PII'siz) alanlar netleşmeli; koleksiyonlar boşsa data-grounding etkisiz → Faz Ö2 önceliklenir.
- **Senkron:** `src/lib/news-draft-quality.ts` başında "`src/lib/contentEngine/newsDraftQuality.ts` ile senkron tutun" notu var; değişiklik iki kopyada da yapılmalı.
- **Ücretsiz model sınırı:** Gevşek iskelette bozuk çıktı artabilir → dedup + onarım şart.

## İlişkili planlar

- `memory-bank/seo-autopilot-plan-tr.md` — iş kuralları, OpenRouter birincil
- `memory-bank/faz-gelistirme-checklist-tr.md` — Faz 18–21
