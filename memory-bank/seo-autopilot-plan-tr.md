# SEO Otopilot Planı — spornerede.net (MVP · Ücretsiz)
> Soro (trysoro.com) benzeri, kendi kendine çalışan Türkçe içerik & keyword motoru — **aylık harici API maliyeti: 0 TL**

**Referans:** Faz 18 → 19 → 20 → 21 (`progress.md`, `faz-gelistirme-checklist-tr.md`)  
**İzole kod:** `content-engine/` — ana `src/` dosyalarına dokunulmaz (`memory-bank/content-engine-isolated-plan-tr.md`)  
**Profil:** `SEO_USE_PAID_APIS=false` · **LLM:** OpenRouter `:free` (varsayılan) — Google AI Studio / ücretli Gemini **yok** (fatura sızıntısı riski). GSC + PocketBase/Astro.  
**Hedef:** Günde en fazla **1** haber (`haberler`); admin onay veya auto-publish. Taslak kalitesi “mükemmel AI” değil, **iş akışı + insan düzeltmesi** ile yeterli.

> **Kapsam güncellemesi (2026-05-31):** Otomasyon **yalnızca `haberler`**. Rehber otomasyonu (Faz 20) ve görsel/video üretimi **ertelendi**. Sıradaki geliştirme: **CE-5 → CE-8** (`content-engine-isolated-plan-tr.md`).

---

## 1. Soro Ne Yapıyor? → Bizim Ücretsiz Karşılık

| Soro Özelliği | Ücretsiz MVP yaklaşımı |
|---|---|
| Sitenizi tarar, marka sesini öğrenir | Sabit `brand-voice.txt` + PocketBase kulüp/program sayıları |
| Hedef anahtar kelime bulur | **GSC API** + seed JSON + şehir×branş kataloğu |
| Günlük makale yazar | **OpenRouter sabit `:free` model** (taslak; admin düzenler) |
| Sitenize yayınlar | PocketBase `rehber_yazilari` → Astro `/rehber/[slug]` |
| Teknik SEO yapar | Mevcut JSON-LD, sitemap, OG endpoint |
| Performans takibi | **GSC API** haftalık sync |

**Kullanılmaz (MVP):** Serper.dev, DataForSEO, OpenAI, **Google AI Studio / doğrudan Gemini API** (ücretli veya “yanlışlıkla faturalandırma” riski). `openrouter/free` rastgele router kullanılmaz.

---

## 2. Sistem Mimarisi (Ücretsiz)

```
┌─────────────────────────────────────────────────────────┐
│              SEO OTOPILOT (0 TL / ay)                   │
│                                                         │
│  [Faz 18] Keyword Motoru                                │
│  GSC API + seed-keywords-tr.json + PB şehir/branş       │
│                    ↓                                    │
│  [Faz 19] İçerik Pipeline                               │
│  Kuyruk → site bağlamı → OpenRouter :free (sabit model)   │
│                    ↓                                    │
│  [Faz 20] Yayın & Teknik SEO                            │
│  Admin onay → /rehber/[slug] → sitemap                  │
│                    ↓                                    │
│  [Faz 21] Ölçüm & Geri Bildirim                         │
│  GSC sync → skor / yeniden yaz kuyruğu                  │
└─────────────────────────────────────────────────────────┘
```

### Sunucu yükü
- Günde **1** makale (`SEO_DAILY_ARTICLE_LIMIT=1`)
- Systemd oneshot timer (~50 MB RAM spike, sonra kapanır)
- Yeni servis yok; mevcut PocketBase + Astro SSR

---

## 3. Ücretsiz API ve Kota

| Bileşen | Kaynak | Not |
|---|---|---|
| Keyword (trafik) | Google Search Console API | Service account veya OAuth |
| Keyword (yeni) | `seed-keywords-tr.json` + PB `iller`/`branslar` | ~130+ programatik satır |
| Makale (taslak) | **OpenRouter** + `SEO_OPENROUTER_MODEL=…:free` | ~50 istek/gün (kredi yoksa); `429` → ertesi gün |
| GSC (sadece okuma) | Search Console API | Üretken AI değil; faturalandırma riski yok |
| SERP / hacim | — | GSC `impressions` skor proxy; rakip snippet yok |
| Görsel | `/api/og.png` | AI görsel üretimi yok |
| Yayın / ölçüm | PocketBase + GSC | 0 TL |

### Zorunlu `.env` (ücretsiz profil — OpenRouter birincil)
```env
SEO_USE_PAID_APIS=false
SEO_LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=...              # OpenRouter hesabı: ödeme yöntemi EKLEME (sızıntı önlemi)
SEO_OPENROUTER_MODEL=...:free       # Sabit model; openrouter.ai/models → :free + TR test
SEO_GSC_SITE_URL=https://spornerede.net
SEO_GSC_SERVICE_ACCOUNT_JSON=...
SEO_AUTO_PUBLISH=false
SEO_DAILY_ARTICLE_LIMIT=1
```

### Tanımlanmayacak anahtarlar (MVP)
`SEO_GEMINI_API_KEY`, `SEO_SERPER_API_KEY`, `SEO_DATAFORSEO_*`, `OPENAI_API_KEY`

### Neden OpenRouter birincil? (ürün kararı)

| Gerekçe | Açıklama |
|---|---|
| Fatura riski | Google Cloud / AI Studio’da kart veya “ücretsiz kotayı aşınca ücret” sızıntısı istenmiyor → **üretken içerik Google’a gitmez** |
| İş akışı | Çıktı = **taslak** (`incelemede`); admin TipTap ile düzeltir → “en zeki model” şart değil |
| Maliyet | `:free` model = **0 TL**; günde 1 makale ≪ 50 istek/gün limiti |
| Yapı | Prompt’ta JSON/blok formatı + parse retry → orta modellerde de yeterli |

**GSC ayrı:** Search Console API yalnızca okuma/rapor; Gemini faturalandırması ile karışmaz.

### OpenRouter operasyon kuralları

1. **Sabit model ID** — `openrouter/free` rastgele router **kullanma** (kalite dalgalanır).
2. **Model seçimi:** OpenRouter model listesinden `:free` + kısa Türkçe test (“İstanbul’da voleybol kursu rehberi, 2 paragraf”).
3. **Hesap:** Kredi kartı bağlama; bakiye negatif olmasın (free modeller bile bloklanabilir).
4. **Parse:** Çıktıda `---META---` / JSON blokları; parse fail → 1 retry, sonra ertesi gün.
5. **İleride (opsiyonel):** `SEO_LLM_PROVIDER=google` yalnızca bilinçli opt-in; varsayılan değişmez.

Örnek model adayları (canlı listeden doğrulanacak): `qwen/qwen-2.5-72b-instruct:free`, `meta-llama/llama-3.3-70b-instruct:free` — hangisi TR + format testini geçerse `SEO_OPENROUTER_MODEL` olarak sabitlenir.

---

## 3A. MVP kabul kriterleri (0 TL)

### Ne ücretsiz kalır (kalıcı)

| Bileşen | Araç | Maliyet |
|---|---|---|
| Keyword (mevcut trafik) | Google Search Console API | **0 TL** |
| Keyword (yeni fikir) | Sabit seed listesi + PocketBase şehir/branş kataloğu | **0 TL** |
| Yayın | PocketBase + Astro `/rehber/` + mevcut sitemap/JSON-LD | **0 TL** |
| Ölçüm | GSC API (haftalık sync) | **0 TL** |
| Görseller | Mevcut `/api/og.png` (AI görsel yok) | **0 TL** |
| Sunucu | Mevcut systemd timer (günde 1 çalışma ≈ 50 MB RAM spike) | **0 TL ek** |

### MVP’de **kapatılan** ücretli servisler

| Servis | Neden kapatılır | Yerine ne |
|---|---|---|
| **DataForSEO** | Min. ~$50 bakiye | Arama hacmi/zorluk alanları boş veya GSC impression proxy |
| **Serper.dev** | Ücretsiz kota sınırlı, kota bitince ücret | SERP snippet yerine GSC sorgu metni + site içi veri (kulüp/program sayısı) |
| **OpenAI** | Ücretli | Kullanılmaz |
| **Google AI Studio / Gemini API** | Fatura sızıntısı riski | **OpenRouter `:free` sabit model** |

### İçerik üretimi: OpenRouter `:free` (MVP)

- `content-pipeline.ts` → OpenRouter Chat Completions, `model: SEO_OPENROUTER_MODEL`.
- Kota: tipik **50 istek/gün** (OpenRouter free; kredi yoksa) — günde 1 makale + 1 retry yeterli.
- `429` / timeout → makaleyi ertele, log + ertesi gün timer.
- Admin her taslakta düzenler; yayın kalitesi insan + site verisi (kulüp sayısı) ile sağlanır.

**Tamamen API’siz alternatif:** Şablon makale (`{sehir}`, `{brans}`) — LLM kapalı `SEO_LLM_PROVIDER=template`; acil durum yedek.

### Keyword motoru (sıfır TL)

```
1. GSC: impression ≥ 50, CTR < %3 → öncelikli kuyruk
2. Seed: scripts/seo-autopilot/seed-keywords-tr.json (~130 satır)
3. Programatik: tüm (şehir × branş) kombinasyonları PB’den üret
4. Skor: GSC impression + iç link var mı? (DataForSEO/Serper yok)
```

### MVP kabul kriterleri (sıfır maliyet)

- [ ] Aylık harici API faturası: **0 TL**
- [ ] Günde en fazla 1 taslak (ücretsiz kota korunur)
- [ ] İlk 30 gün: admin onayı zorunlu (`SEO_AUTO_PUBLISH=false`)
- [ ] Serper/DataForSEO env anahtarları **tanımlı değil**

### Ücretli genişleme (Faz 18+ sonrası, isteğe bağlı)

Trafik büyüyünce: Serper, DataForSEO. Üretken LLM için bilinçli opt-in (`SEO_LLM_PROVIDER=google`) — **varsayılan OpenRouter free kalır.**

---

## 4. PocketBase Şeması

### `seo_keywords` koleksiyonu (yeni)
```
id            - auto
anahtar       - text (unique)  — "ankara voleybol kursu"
kategori      - select: nedir|nasil|faydalari|sehir_brans|ebeveyn|sezonsal|diger
gsc_impression - number (GSC; skor proxy, opsiyonel)
niyet         - select: bilgi|yonlendirme|islem
skor          - number (öncelik; yüksek = önce)
durum         - select: kuyrukta|yaziliyor|yayinda|dusuk_performans
site_context  - json (kulüp/program sayısı, il/branş slug — ücretsiz bağlam)
created       - auto
```

### `rehber_yazilari` koleksiyonu (yeni)
```
id                - auto
baslik            - text
slug              - text (unique)
meta_title        - text (max 60 karakter)
meta_description  - text (max 155 karakter)
icerik_html       - text (LLM çıktısı; temizlenmiş)
icerik_json       - json (yapısal; H2, H3, sorular)
anahtar_kelime    - relation → seo_keywords
ic_linkler        - json [{ url, anchor }]
sema_tipi         - select: Article|HowTo|FAQPage|kombinasyon
yayinlanma_tarihi - date
durum             - select: taslak|incelemede|yayinda|arsiv
gsc_tiklama       - number (haftalık güncelleme)
gsc_gosterim      - number
gsc_konum         - number
created           - auto
updated           - auto
```

---

## 5. İçerik Kategorileri (spornerede.net için)

### A. "X Nedir?" Rehberleri (bilgi niyeti)
- "Voleybol nedir?", "Jimnastik nedir?", "Aikido nedir?"
- Hedef: zero-click / featured snippet → otorite

### B. "X Nasıl Yapılır/Öğrenilir?" (bilgi + yönlendirme)
- "Yüzme nasıl öğrenilir?", "Tenis nasıl oynanır?"
- CTA: "Yakınındaki [branş] kurslarını bul →"

### C. "X'in Faydaları" (bilgi; E-E-A-T için iyi)
- "Basketbalın çocuklara faydaları", "Yüzmenin sağlığa faydaları"
- Internal: branş landing → kulüp arama

### D. Ebeveyn Rehberleri (yüksek niyet)
- "Çocuk için hangi spor seçilmeli?", "Kaç yaşında spora başlanmalı?"
- Internal: /ara quiz (Faz 15)

### E. Şehir × Branş Derinleştirme (yönlendirme niyeti)
- "İstanbul'da voleybol kursu nasıl bulunur?"
- Mevcut landing'leri destekler, trafik aktarır

### F. Sezonal İçerik (planlı zamanlama)
- "Yaz spor kursları 2026 rehberi" (Mayıs)
- "Okula dönüş: çocuklar için spor" (Ağustos)

---

## 6. Teknik Mimari (Dosya Yapısı)

```
scripts/
  seo-autopilot/
    seed-keywords-tr.json   # ~130 sabit Türkçe seed
    keyword-engine.ts       # GSC + seed + PB katalog → kuyruk
    content-pipeline.ts     # Keyword + site bağlamı → OpenRouter :free → taslak
    llm-openrouter.ts       # OpenRouter client (sabit :free model)
    publish-articles.ts     # Taslak onay → yayınla
    gsc-reporter.ts         # Haftalık GSC performans sync
    prompts/
      article-base.txt      # Türkçe makale ana prompt
      brand-voice.txt       # Marka sesi kılavuzu
      internal-links.txt    # İç link enjeksiyon talimatları

src/pages/
  rehber/
    index.astro             # Rehber hub sayfası (liste)
    [slug].astro            # Tek makale sayfası

src/lib/repositories/
  seoArticles.ts            # PocketBase CRUD

systemd/
  seo-content-daily.service # Günlük içerik üretimi
  seo-content-daily.timer   # Sabah 03:00'da çalışır
  seo-keyword-weekly.service # Haftalık keyword discovery
  seo-keyword-weekly.timer  # Pazartesi 02:00'da çalışır
```

---

## 7. Content Pipeline Detayı (Faz 19)

### Adım 1: Keyword Seçimi
```typescript
// En yüksek skorlu, henüz yazılmamış keyword
const keyword = await pb.collection('seo_keywords')
  .getFirstListItem('durum="kuyrukta"', { sort: '-skor' });
```

### Adım 2: Site Bağlamı (ücretsiz; SERP yok)
```typescript
const ctx = await buildSiteContext(keyword); // PB: kulüp sayısı, program sayısı, il/branş
// GSC'de bu sorgu varsa: impressions, avg position prompt'a eklenir
```

### Adım 3: İç Link Tespiti
```typescript
// Hangi /branslar ve /kulupler sayfaları relevanttır?
const brans = extractBransFromKeyword(keyword.anahtar); // "voleybol"
const sehir = extractSehirFromKeyword(keyword.anahtar);  // "ankara"
const internalLinks = buildInternalLinks(brans, sehir);
```

### Adım 4: LLM Prompt (OpenRouter)
```
Sen spornerede.net için Türkçe SEO içerik yazarısın.
Hedef anahtar kelime: {keyword.anahtar}
Arama niyeti: {keyword.niyet}
Kategori: {keyword.kategori}

Sitedeki güncel veriler (rakip analizi yok):
{siteContext}

İç link edilmesi gereken sayfalar:
{internalLinks}

[brand-voice.txt içeriği]

Yaz: başlık, meta_title (≤60), meta_description (≤155),
H1, H2-H3 yapısı, 1200-1800 kelime içerik, FAQ (5 soru),
JSON-LD schema ({schema_type}).
```

### Adım 5: Çıktı Parse & Kaydet
```typescript
const parsed = parseArticleOutput(llmResponse); // parse fail → 1 retry
await pb.collection('rehber_yazilari').create({
  ...parsed,
  anahtar_kelime: keyword.id,
  durum: 'incelemede', // admin onayı bekleniyor
});
await pb.collection('seo_keywords').update(keyword.id, { durum: 'yaziliyor' });
```

---

## 8. Yayın Sayfası `/rehber/[slug].astro`

### Özellikler
- `Article` + `FAQPage` / `HowTo` JSON-LD (schema_tipi'ne göre)
- Breadcrumb: Ana Sayfa → Rehber → [Kategori] → [Başlık]
- CTA bloku: "Bu branşta kulüp ara →" (internal link)
- İlgili makaleler listesi (aynı kategoriden 3 öneri)
- Yazar alanı: "spornerede.net Editörü" + tarih (E-E-A-T)
- OG image: dinamik `/api/og.png?title=&kicker=Rehber&badge=`
- Canonical self-referencing
- `hreflang="tr-TR"`

### Sayfalama / Hub
`/rehber` → Kategorilere göre gruplandırılmış makale listesi  
`/rehber/voleybol` → Voleybol kategorisi makaleler  
`/rehber/istanbul` → İstanbul şehir rehberleri

---

## 9. Keyword Motoru Algoritması (Faz 18)

### A. GSC'den Düşük Performanslı Sorguları Çek
```typescript
// 100+ impression, CTR < %3 → fırsat var
const gscOpps = await fetchGSCQueries({
  minImpressions: 100,
  maxCTR: 0.03,
  dateRange: 'last28days'
});
```

### B. Yeni Keyword Discovery
```
Seed keywords (spornerede nişinden):
- "{branş} nedir"         × 15 branş = 15
- "{branş} nasıl"         × 15 branş = 15
- "{şehir} {branş} kursu" × 5 büyük şehir × 15 branş = 75
- "{branş} faydaları"     × 15 branş = 15
- "çocuklar için {branş}" × 10 branş = 10
→ Başlangıç havuzu: ~130 keyword
```

### C. Skor Hesaplama (ücretsiz)
```
skor = (gsc_impression / 10)           # GSC varsa; yoksa seed sıra numarası tersi
     + (niyet_bonus)                   # islem=5, yonlendirme=3, bilgi=1
     + (ic_link_potansiyeli ? 5 : 0)   # /branslar veya şehir landing var mı?
     + (kategori_bonus)                # sehir_brans +2, ebeveyn +1
```

---

## 10. Admin Onay Akışı

```
Otomatik üretildi (durum: incelemede)
        ↓
Admin panelde yeni "SEO İçerik" sekmesi
        ↓
İçeriği gözden geçir, düzenle (TipTap editor)
        ↓
"Yayınla" → durum: yayinda, yayinlanma_tarihi: now()
        ↓
Astro SSR otomatik render eder
        ↓
Sitemap'e eklenir
```

> **Not:** "Otomatik yayınla" modu da eklenebilir (Faz 21'de ayar olarak); başlangıçta insan gözü önerilir.

---

## 11. Lightweight Sunucu Stratejisi

### Systemd Timer (persistent süreç değil)
```ini
# /etc/systemd/system/seo-content-daily.timer
[Timer]
OnCalendar=*-*-* 03:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

```ini
# /etc/systemd/system/seo-content-daily.service
[Service]
Type=oneshot
User=spornerede
WorkingDirectory=/opt/spornerede/current
ExecStart=/usr/bin/node scripts/seo-autopilot/content-pipeline.js
Environment="NODE_ENV=production"
EnvironmentFile=/opt/spornerede/.env
```

- **RAM etkisi:** ~50MB peak (Node.js başlar, API çağırır, kaydeder, kapanır)
- **CPU:** 1-2 saniyelik spike (API bekleme süresi hariç)
- **Disk:** Her makale ~5-15KB HTML → 365 makale/yıl ≈ 5MB

### API Anahtarları (.env) — ücretsiz profil
Bkz. **§3 Zorunlu `.env`**. Ücretli anahtarlar MVP'de tanımlanmaz.

---

## 12. Ölçüm & Geri Bildirim Döngüsü (Faz 21)

### Haftalık GSC Sync
```typescript
// Her pazartesi çalışır
for (const article of publishedArticles) {
  const perf = await fetchGSCPagePerformance(article.slug);
  await pb.collection('rehber_yazilari').update(article.id, {
    gsc_tiklama: perf.clicks,
    gsc_gosterim: perf.impressions,
    gsc_konum: perf.position,
  });
}
```

### Otomatik İlgili Makale Önerisi
```
Eğer makale:
  - 2+ hafta yayında
  - >200 gösterim, <5 tıklama (yüksek gösterim, düşük CTR)
  → Başlık / meta açıklama A/B varyantı oluştur

Eğer makale:
  - >50 tıklama / hafta
  → Aynı kategoriden 2 yeni keyword öner (genişletme)

Eğer makale:
  - <10 gösterim / 4 hafta sonra
  → Keyword'ü "dusuk_performans" işaretle, yeniden yazılacaklar kuyruğuna al
```

### Admin Dashboard Widgeti
- Toplam yayındaki rehber makalesi sayısı
- Bu haftaki toplam tıklama / gösterim (GSC)
- En iyi performanslı 5 makale
- Onay bekleyen taslak sayısı
- Kuyruktaki keyword sayısı

---

## 13. İlk 30 Gün İçerik Takvimi (Öneri)

| Gün | Kategori | Örnek Başlık |
|---|---|---|
| 1-5 | "Nedir" | Voleybol / Basketbol / Yüzme / Tenis / Jimnastik |
| 6-10 | "Faydaları" | Yüzme / Koşu / Futbol / Bisiklet / Yoga |
| 11-15 | Ebeveyn | "Çocuk için spor seçimi", "Kaç yaşında başlanmalı?", "Okul sporları rehberi" |
| 16-20 | "Nasıl?" | "Tenis nasıl öğrenilir?", "Yüzme nasıl öğrenilir?" |
| 21-25 | Şehir×Branş | "İstanbul voleybol", "Ankara basketbol", "İzmir yüzme" |
| 26-30 | Sezonal | "Yaz spor kursları rehberi 2026" |

---

## 14. Entegrasyon Kontrol Listesi (Faz 20)

- [ ] PocketBase `seo_keywords` + `rehber_yazilari` koleksiyonları eklendi
- [ ] `src/pages/rehber/index.astro` hub sayfası (liste + SEO)
- [ ] `src/pages/rehber/[slug].astro` detay sayfası (JSON-LD, CTA, ilgili)
- [ ] `src/lib/repositories/seoArticles.ts` CRUD
- [ ] `scripts/seo-autopilot/keyword-engine.ts` çalışıyor
- [ ] `scripts/seo-autopilot/content-pipeline.ts` çalışıyor
- [ ] Admin panelde "SEO İçerik" sekmesi
- [ ] Systemd timer'lar kuruldu (seo-content-daily + seo-keyword-weekly)
- [ ] `.env`: OpenRouter + GSC; `SEO_GEMINI_API_KEY` yok
- [ ] OpenRouter’da TR + format testi geçen sabit `:free` model seçildi
- [ ] `seed-keywords-tr.json` yüklendi / keyword-engine seed çalıştı
- [ ] Sitemap `rehber` sayfalarını içeriyor
- [ ] GSC'de `rehber/*` sayfaları index edildi
- [ ] İlk 5 makale yayında, GSC'de görünür

---

## 15. Riskler ve Azaltma Stratejileri

| Risk | Olasılık | Azaltma |
|---|---|---|
| AI içerik Google tarafından penalize edilir | Orta | Human review zorunlu; özgün veriler (kulüp sayısı, şehir istatistikleri) ekle |
| OpenRouter free kota (`429`) | Orta | `SEO_DAILY_ARTICLE_LIMIT=1`; ertesi güne ertele |
| Format/parse hatası (zayıf model) | Orta | Yapılandırılmış prompt + retry; admin düzenleme zorunlu |
| OpenRouter hesap negatif bakiye | Düşük | Kart ekleme; sadece free model ID |
| Düşük kaliteli / jenerik içerik | Orta | Admin onay; prompt'a PB gerçek sayılar; ilk 30 makale elle kontrol |
| GSC API erişim hatası | Düşük | Service account; keyword motoru seed ile yine çalışır |
| AI içerik Google cezası | Orta | İnsan onayı; siteye özgü veri; duplicate kontrolü (slug/başlık) |
