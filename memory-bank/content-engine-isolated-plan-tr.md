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

### Önerilen uygulama sırası
Ö1.2 (dolgu kaldır) → Ö1.1 (data-grounding) → Ö2.2 (dedup gate, ölçüm) → Ö1.3 (iskelet gevşet) → Ö2.1 + Ö2.3 (çeşitlilik + model).

### Riskler / açık sorular
- **PB şeması:** `kulupler`/`programlar` alan adları ve yayına uygun (PII'siz) alanlar netleşmeli; koleksiyonlar boşsa data-grounding etkisiz → Faz Ö2 önceliklenir.
- **Senkron:** `src/lib/news-draft-quality.ts` başında "`src/lib/contentEngine/newsDraftQuality.ts` ile senkron tutun" notu var; değişiklik iki kopyada da yapılmalı.
- **Ücretsiz model sınırı:** Gevşek iskelette bozuk çıktı artabilir → dedup + onarım şart.

## İlişkili planlar

- `memory-bank/seo-autopilot-plan-tr.md` — iş kuralları, OpenRouter birincil
- `memory-bank/faz-gelistirme-checklist-tr.md` — Faz 18–21
