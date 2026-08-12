# Ürün İyileştirme Önerileri + Araç Değerlendirmesi (TR)

> Kapsam: az bütçeli MVP girişimi için kod incelemesine dayalı önceliklendirilmiş ürün/teknik öneriler, faz planı geri bildirimi ve aday araçların (BUN, Biome, Fallow, PostHog, Arcjet, Lucide, Motion, Zod) gerekliliği.
> Oluşturma: 2026-06-14 (kod + memory-bank incelemesi sonrası). Bu doküman bir **karar/öneri havuzu**dur; uygulanan maddeler ilgili faz dosyalarına taşınır.

## 0. Tek cümlelik tez

Teknik temel olgun (SSR + PocketBase + SEO + içerik motoru + gelir altyapısı canlı). Asıl darboğaz **"ebeveyn → kulübe ulaşır" anı**; trafik/içerik/reklam koymadan önce bu huni ve onun ölçümü tamamlanmalı. Aksi halde SEO trafiği delik kovaya su taşır.

---

## 1. Öncelikli öneriler

### 🔴 P0 — Bu hafta, ~0 TL, en yüksek etki

| # | Öneri | Kanıt / dosya | Neden |
|---|-------|---------------|-------|
| P0.1 | **Lead (iletişim) hunisini tamir et:** telefonu `tel:` linki + WhatsApp (`wa.me/90…`) + Maps "yol tarifi" (lat/lng zaten var). Ek: "Kulübe mesaj gönder" lead formu → PocketBase'e yaz + kulübe mail. | `src/pages/kulupler/[id].astro:183` telefon **düz metin**; `tel:` yok → `TrackingAutoListeners`'taki `lead_phone_click` **hiç ateşlenemiyor** | Aynı anda 3 şeyi açar: dönüşüm + ölçüm + gelecekteki gelir (lead başına ücret). Telefonu açmayan kulüpte bile lead kaybolmaz. |
| P0.2 | **Arama performansı:** referans veriyi (iller/ilçeler/branşlar) süreç-içi bellek cache + kısa TTL; `getClubById` ve landing'leri PocketBase `filter` ile dar sorguya çevir. | `catalog.ts` `searchClubs()` her aramada 6 koleksiyonu `getFullList()` ile tümüyle çekiyor; `getClubById` tek kulüp için `searchClubs({})` → **tüm DB'yi** belleğe yükler. `repositories`'te cache yok (doğrulandı). | Programatik SEO sayfaları her tarandığında tam-tarama tetikliyor. Ucuz VPS'te CPU/RAM zirvelerini ve yanıt süresini düşürür. |

### 🟠 P1 — Güven & dönüşüm (birkaç gün, düşük maliyet)

| # | Öneri | Kanıt / not | Neden |
|---|-------|-------------|-------|
| P1.1 | **Yorum / puanlama (admin onaylı MVP).** | `puan` + `yorumSayisi` alanları **zaten var**, UI yok | Sosyal kanıt (dönüşüm) + bedava taze UGC içerik (AI haber riskine karşı gerçek sinyal) + `Review`/`AggregateRating` JSON-LD ile aramada **yıldız** (CTR planının hedefi). KVKK: takma ad + onay. |
| P1.2 | **Panel profil doluluk göstergesi** (yüzde + eksik alana tek tık). | `activeContext.md` backlog'da var | Dolu profil = daha çok lead = kulüp ödemeye devam eder; "neden çıkmıyorum?" destek e-postası azalır. |

### 🟡 P2 — Geliri kanıtla (mekanizma; kod ağırlığı düşük)

> Mevcut model: branş-başına üyelik + manuel EFT (`membershipPricing.ts`, `bankTransfer.ts`). Eksik olan **kulübe değeri göstermek**.

| # | Öneri | Neden |
|---|-------|-------|
| P2.1 | **Panelde "Lead/Trafik özeti"** ("bu ay 12 kişi seni aradı/mesaj attı"). P0.1 lead'leri DB'ye yazınca mümkün. | Kulübün ödemeye **devam etme** sebebi; "Öne Çıkar" (`oneCikan` alanı zaten var) satışının kancası. Ödeme entegrasyonundan **önce** gelir; önce değer ispatı. |
| P2.2 | Ücretsiz temel listeleme → ücretli "öne çıkan sıralama / ekstra branş / galeri kotası" funnel'ı netleştir. Otomatik ödeme (Iyzico/Stripe) ancak **ilk ~10 ödeyen kulüp** sonrası. | Manuel EFT MVP'de yeterli; erken ödeme entegrasyonu efor israfı. |

### ⚙️ Teknik borç / hijyen

- **Açık bug:** Admin "Geribildirimler" `/api/admin/feedbacks` 500 (memory-bank'ta açık).
- **README** hâlâ Astro şablon varsayılanı → eş kurucu/yeni geliştirici onboarding için 30 dk'lık gerçek README.
- **İçerik motoru disiplini:** trafik kanıtı olmadan hacim Google için risk; GSC'de gerçekten gösterim alan birkaç sorguya odaklan (kalite > hacim).
- _Not:_ Daha önce "mükerrer dosya" şüphesi vardı; `git ls-files` ile **tek kopya** doğrulandı (Glob'un `/` ve `\` ile çift listelemesi araç artefaktıydı). Aksiyon gerekmiyor.

### Önerilen 2 haftalık sıra
1. Lead funnel (P0.1) → 2. Arama cache (P0.2) → 3. Panel lead özeti (P2.1) → 4. Yorum MVP (P1.1) → 5. `/api/admin/feedbacks` 500 fix.

---

## 2. Faz planı geri bildirimi (düzenleme/silme önerileri)

> Silme yapmadım; aşağıdakiler **öneri**. Onay sonrası ilgili dosyalara işlenebilir.

- **Sıralama önerisi:** Lead funnel ve yorum sistemi şu an fiilen "Faz 4 (büyük epik, en sona)" altında veya örtük. **Lead funnel'ı Faz 13–17'nin önüne**, yorum sistemini de yukarı çekmeyi öneriyorum: SEO/ölçüm yatırımının geri dönüşü çalışan bir dönüşüm hunisine bağlı.
- **Numara karışıklığı:** "Faz 4" kronolojik olarak en sonda ama düşük numaralı; okuyucu kayboluyor. Faz numaralarını korumak isteniyorsa, checklist başına "kronolojik uygulama sırası" tablosu (zaten kısmen var) tek doğru kaynak yapılmalı.
- **Doküman birleştirme (sonra):** SEO/büyüme planı birden çok dosyaya yayılmış (`seo-ads-plan.md`, `seo-ctr-organic-plan-tr.md`, `seo-autopilot-plan-tr.md`, `growth-revenue-traffic-tr.md`, `content-engine-isolated-plan-tr.md`). Solo founder için senkron yükü yüksek. İleride 1 "SEO/içerik" + 1 "gelir/büyüme" dosyasına konsolidasyon önerilir (acil değil).

---

## 3. Araç değerlendirmesi

> Filtre: "az bütçe + canlı MVP + işi kolaylaştırma". Bağlam: Astro SSR (React **değil**) + PocketBase + TypeScript + npm + Windows dev → Linux systemd deploy + Cloudflare önde.

| Araç | Karar | Neden (bu projeye özel) |
|------|-------|--------------------------|
| **Zod** (zod.dev) | ✅ **Benimse (kademeli)** | API uçları `request.json()` + elle `body?.x?.toString()` ile doğruluyor (örn. `membership-plans.ts`). Hiç kullanılmıyor. Yeni lead formu ile birlikte API sınırlarında (basvuru, contact, lead, panel) güvenliği artırır, kodu azaltır. Küçük, framework-bağımsız. **İşi gerçekten kolaylaştırır.** |
| **Biome** (biomejs.dev) | ✅ **Benimse** | Projede **hiç** lint/format config'i yok (doğrulandı). Tek Rust aracı = ESLint+Prettier yerine, hızlı, neredeyse sıfır config. Sadece dev aracı; production runtime'a dokunmaz → risk düşük. |
| **Arcjet** (arcjet.com) | 🟡 **Önce Cloudflare'i kullan** | İhtiyaç gerçek (panel/login rate limit + form spam — backlog'da var) ama **önde Cloudflare zaten var**: ücretsiz Rate Limiting + bot yönetimi + **Turnstile (ücretsiz CAPTCHA)**. Önce bunlar; Arcjet ancak yetmezse (harici SaaS + ek bağımlılık). |
| **PostHog** (posthog.com) | 🟡 **Sonra, seçici** | **Session replay** erken üründe altın değerinde (kullanıcının lead hunisinde takıldığı yeri izlersin). Cömert ücretsiz katman var. Ama: ekstra script/cookie → KVKK/consent yükü ve GA4 yeni oturdu. Önce P0/P1 bitsin; sonra anahtar sayfalarda replay aç. İleride dağınık GA4/GTM'i değiştirebilir. |
| **Fallow** (fallow.tools) / `knip` | 🟡 **Tek seferlik temizlik** | Ölü kod/duplikasyon bulma faydalı ama günlük zorunlu değil. JS/TS'te bilinen alternatif **`knip`** (kullanılmayan dosya/dep). Birikim temizliği için ara sıra çalıştır. |
| **Lucide** (lucide.dev) | ⚪ **Opsiyonel polish** | "Tree-shakeable **React** paketi" bu projeye uymaz (Astro). İstenirse `lucide-static` ile SVG kullanılabilir; şu an emoji + inline SVG yeterli. Düşük öncelik. |
| **Motion** (motion.dev) | ⛔ **Şimdilik geç** | Ağırlıklı React odaklı; Astro'da çoğu sayfa statik. Performans için **shimmer animasyonu yeni kaldırıldı** (Lighthouse). JS animasyon kütüphanesi tam optimize edilen şeyde regresyon riski. CSS animasyonları yeterli. |
| **BUN** (bun.com) | ⛔ **Şimdilik geç** | Canlı, systemd + auto-update + `npm install --prefix content-engine` ile çalışan bir üründe runtime/paket yöneticisi göçü yüksek risk. Astro zaten Vite kullanıyor. Kazanç (hız) < kırılma riski. İleride yeniden değerlendir. |

### Özet
- **Şimdi al:** Zod, Biome.
- **Sahip olduğunu kullan:** Cloudflare Rate Limiting + Turnstile (Arcjet yerine).
- **Sonra/seçici:** PostHog (session replay), knip/Fallow (tek seferlik).
- **Geç:** Bun, Motion, Lucide.

> İlke: az bütçeli MVP'de her yeni araç bir **bakım/consent/risk yükü**dür. Sadece dönüşümü, güvenilirliği veya geliştirici hızını **net** artıranlar (Zod, Biome) hemen; gerisi kanıt sonrası.
