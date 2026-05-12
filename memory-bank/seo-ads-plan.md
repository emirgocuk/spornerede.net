# SporNerede.net — SEO + Reklam Hazırlığı Planı

Bu doküman, organik aramada büyümek ve **gelecekte ücretli reklam (Google Ads / Meta / programmatic)** vermeye geçtiğimizde altyapının hazır olması için yapılması gerekenleri tek bir yerde toplar.

**Faz:** 12 — SEO Güçlendirme + Reklam Altyapısı
**Durum:** Plan onaylandı, uygulamaya hazır
**Sahibi:** Ürün + Frontend ekibi
**Bağlı dokümanlar:** `activeContext.md`, `progress.md`, `security-privacy.md`

---

## 0. Mevcut Durum Hızlı Denetim

| Alan | Durum | Not |
|---|---|---|
| Title / description / canonical | ✅ var | `BaseLayout.astro` |
| OG / Twitter Card | ⚠️ var ama görsel yok | `/og-image.png` referansı var, dosya yok |
| Sitemap | ⚠️ var ama eksik | `lastmod`, `priority`, `changefreq` yok |
| Robots | ⚠️ kısmi | `/panel`, `/admin`, `/basvuru`, parametreli `/ara` engellenmiyor |
| Yapısal veri | ❌ kısmi | Sadece haberlerde `NewsArticle` JSON-LD var |
| URL'ler | ❌ | `/ilanlar/42`, `/kulupler/17` — slug değil sayısal ID |
| 404 | ❌ | `Astro.redirect('/ara')` → Google için "soft 404" |
| Detay sayfalarında özel OG | ❌ | Yok |
| Şehir/ilçe landing'leri | ⚠️ | İçerik çok ince ("0 kulüp bulundu" sayfaları zayıf sinyal) |
| Core Web Vitals | ⚠️ | `<img>` etiketleri, uzak Google Fonts, `astro:assets` kullanılmıyor |
| Analytics (GA4 / Search Console) | ⚠️ | Search Console kayıtlı, GA4 ve GTM yok |
| KVKK / Consent Mode v2 | ❌ | Yok — reklam için **zorunlu** |
| Reklam slotları | ❌ | Layout'ta yer rezervi yok (CLS riski) |
| Yasal sayfalar | ❌ | Gizlilik, Çerez, KVKK, Kullanım Koşulları yok |

---

## 1. Paket A — SEO Temeli (önce bu)

Hedef: Crawl + indeksleme kalitesini ciddi düzeyde yükseltmek. Tek PR olarak götürülebilir.

### A1. Slug tabanlı URL'ler + 301 yönlendirme
- [ ] PocketBase `kulup_programlari` ve `kulupler` koleksiyonlarında `slug` alanını zorunlu ve unique hale getir
- [ ] Otomatik slug üretici: `<branş>-<kulüp adı>-<id>` (uniqueness için id eki)
- [ ] `/ilanlar/[id].astro` → `/ilanlar/[slug].astro`
- [ ] `/kulupler/[id].astro` → `/kulupler/[slug].astro`
- [ ] Eski sayısal ID URL'lerinden yeni slug URL'lerine **301 redirect** (`src/middleware.ts`)
- [ ] Tüm internal linkleri (admin, panel, sitemap) yeni slug rotalarına çevir
- [ ] Sitemap güncelle

### A2. Global JSON-LD enjeksiyonu (`BaseLayout.astro`)
- [ ] `Organization` schema: ad, logo, sameAs (sosyal medya), iletişim
- [ ] `WebSite` schema + `potentialAction` (sitelink searchbox → `/ara?q=...`)
- [ ] Breadcrumb component + `BreadcrumbList` JSON-LD (prop olarak alır)

### A3. Sayfa bazlı yapısal veri
- [ ] **Kulüp detayı** → `SportsActivityLocation` + `LocalBusiness`
  - Telefon, adres, geo (enlem/boylam), `priceRange`, açılış saatleri
- [ ] **İlan detayı** → `Course` veya `Event` (içerik tipine göre)
  - Tarih, fiyat (`Offer`), sağlayıcı (`provider` → kulüp), konum, görseller, level
- [ ] **Ana sayfa SSS** → `FAQPage` JSON-LD (`FAQSection.astro`)
- [ ] **Arama sonuçları (`/ara`)** → `ItemList` (ilk 10 sonuç)

### A4. OG image altyapısı
- [ ] Statik default `public/og-image.png` (1200×630) — marka anahtarlı
- [ ] Dinamik OG endpoint: `src/pages/api/og/[slug].png.ts`
  - Astro endpoint, Resvg/Satori veya basit Canvas ile sayfa başlığı + branş emoji + marka bandı bas
  - Cache-Control: 1 gün
- [ ] `BaseLayout` prop'a `ogImage` parametresi, detay sayfaları dinamik URL gönderir

### A5. Gerçek 404 davranışı
- [ ] `/ilanlar/[slug]`, `/kulupler/[slug]`, `/haberler/[slug]`, `/branslar/[brans]`, şehir/ilçe sayfalarında `Astro.redirect('/ara')` yerine:
  - `Astro.response.status = 404`
  - `BaseLayout`'a `noIndex: true` geçir
- [ ] `src/pages/404.astro` özelleştir: marka uyumlu, arama kutusu, popüler branşlar, ana sayfaya dönüş
- [ ] Nginx config `error_page 404 /404.html;` doğrula (SSR'de zaten dinamik döner)

### A6. `robots.txt` sıkılaştırma
- [ ] Engellenecekler:
  ```
  Disallow: /api/
  Disallow: /admin
  Disallow: /panel
  Disallow: /basvuru
  Disallow: /ara?*
  Allow: /ara$
  ```
- [ ] Sitemap referansları güncel kalsın

### A7. Sitemap zenginleştirme
- [ ] Tüm sitemap endpoint'lerine `<lastmod>` ekle (PocketBase `updated` alanı)
- [ ] `<changefreq>` ve `<priority>` ekle:
  - Ana sayfa: `daily` / `1.0`
  - Listeleme/şehir: `weekly` / `0.8`
  - Kulüp detay: `weekly` / `0.7`
  - İlan detay: `weekly` / `0.7`
  - Haber: `monthly` / `0.5`
- [ ] **Boş/ince kombinasyonları çıkar**: 0 kulüplü şehir+branş sayfaları sitemap'e girmesin
- [ ] 50.000 URL üstüne çıkarsa `urlset` bölme (paginated sitemaps)

---

## 2. Paket B — Reklam Altyapısı

Hedef: Google Ads / Meta Ads açıldığında veri akışı, kullanıcı onayı ve atıf çalışsın. **Reklam vermeden ÖNCE kurulmalı.**

### B1. KVKK Çerez Banner'ı + Consent Mode v2
- [ ] `src/components/ConsentBanner.astro`
  - "Tümünü Kabul Et" / "Reddet" / "Ayarları Yönet"
  - Kategoriler: zorunlu (her zaman), analiz, pazarlama
- [ ] Onay öncesi varsayılan:
  ```js
  gtag('consent', 'default', {
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'analytics_storage': 'denied',
    'wait_for_update': 500
  });
  ```
- [ ] Onay sonrası `gtag('consent', 'update', ...)`
- [ ] LocalStorage'a 12 ay saklama, "Çerez Tercihleri" linki footer'da

### B2. GA4 + Google Tag Manager
- [ ] GTM container snippet → `BaseLayout` `<head>` + `<body>` başı (consent'e bağlı)
- [ ] GA4 + Google Ads tag GTM içinden
- [ ] `dataLayer.push` event'leri (uygulamada tetikle):
  - [ ] `view_listing` (ilan detayı görüntülendi)
  - [ ] `view_club` (kulüp detayı görüntülendi)
  - [ ] `search_performed` (arama yapıldı — filtre değerleriyle)
  - [ ] `lead_phone_click` (`tel:` tıklama)
  - [ ] `lead_email_click` (`mailto:` tıklama)
  - [ ] `lead_maps_click` (Google Maps tıklama)
  - [ ] `application_submit` (kulüp başvurusu gönderildi)
  - [ ] `application_success` (server-side confirm sonrası)
  - [ ] `contact_form_submit` (iletişim formu)
  - [ ] `feedback_submit` (geribildirim widget)
- [ ] **Server-side mirror** event'ler: `/api/internal/track` endpoint'i ile first-party log
  - Cookie'siz dünyaya dayanıklı, GA4 outage'larında veri kaybı yok

### B3. Yasal sayfalar (reklam onayı için zorunlu)
- [ ] `/gizlilik-politikasi`
- [ ] `/cerez-politikasi`
- [ ] `/kvkk-aydinlatma-metni`
- [ ] `/kullanim-kosullari`
- [ ] Footer'a 4 link
- [ ] Reklam paneline başvurularken bu URL'ler talep edilir

### B4. CLS-safe reklam slot rezervasyonu
- [ ] `src/components/AdSlot.astro` — sabit `min-height`, `aspect-ratio`, görünmez placeholder
- [ ] Yerleştirilecek noktalar:
  - `/ara` sonuç grid'i: 3. ve 7. karttan sonra
  - Ana sayfa: NewsBar altı (728×90 banner alanı)
  - Kulüp detayı: sidebar (300×250)
- [ ] **İlan detay sayfasında reklam KOYULMAZ** — dönüşüm noktası
- [ ] Reklam açıldığında `<AdSlot provider="adsense" slot="xxx" />` kolay swap edilebilir

### B5. `ads.txt` placeholder
- [ ] `public/ads.txt` boş (veya minimal yorumlu)
- [ ] AdSense onayı sonrası satır eklenir:
  ```
  google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
  ```

### B6. UTM yakalama + atıf
- [ ] `src/lib/analytics/attribution.ts`
  - URL'deki `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content` cookie'ye yaz (30 gün)
  - First-touch + last-touch ayrı sakla
- [ ] Başvuru, iletişim ve geribildirim formlarında gizli alan olarak gönder
- [ ] Admin başvuru detayında "Hangi kampanyadan geldi" gösterimi

### B7. Meta Pixel + TikTok Pixel placeholder
- [ ] GTM'de tag template'i olarak yatır; Container ID'leri `.env` ile yönetilsin
- [ ] Consent'e bağlı — onay olmadan ateşlenmez

### B8. Search Console + Bing Webmaster + Yandex doğrulama
- [ ] **Google Search Console** zaten ekli ✅
- [ ] **Bing Webmaster Tools** — DNS TXT veya `<meta>` doğrulama
- [ ] **Yandex Webmaster** — TR pazarında ihmal edilmiyor

---

## 3. Paket C — Performans & İçerik Kalitesi

Hedef: Core Web Vitals'ı yeşile çekmek (Hem SEO sıralaması hem Google Ads Quality Score yararı var) + ince sayfaları zenginleştirmek.

### C1. `astro:assets` migration
- [ ] `<img>` etiketlerini `<Image />` ile değiştir (HeroSection, listing galerisi, kulüp logo)
- [ ] PocketBase'den gelen kullanıcı yüklediği görseller için `<img>` ama `width`/`height` zorunlu (CLS)
- [ ] `loading="lazy"`, `decoding="async"` standart
- [ ] WebP/AVIF format otomatik

### C2. Font self-host
- [ ] Google Fonts CDN linkini kaldır
- [ ] `@fontsource/outfit` (zaten dev dependency) ile self-host
- [ ] LCP fontu (Outfit 700) `<link rel="preload" as="font" crossorigin>`
- [ ] `font-display: swap`

### C3. Network ipuçları
- [ ] `preconnect` PocketBase upload host'una (eğer ayrı domain'deyse)
- [ ] `dns-prefetch` GTM ve GA için
- [ ] Astro `prefetch` (`<a data-astro-prefetch>`) Header navigasyonunda aktif

### C4. SSR cache (Cloudflare)
- [ ] Popüler public sayfalar için:
  - `Cache-Control: public, s-maxage=300, stale-while-revalidate=86400`
  - Hedef sayfalar: `/`, `/branslar`, `/branslar/[brans]`, `/sehirler/...`, `/kulupler/[slug]`, `/ilanlar/[slug]`, `/haberler/[slug]`
- [ ] Cookie'li (oturum açık) istekler cache'lenmez — `Vary: Cookie` veya Cloudflare Bypass
- [ ] Cache purge: panelden bir kayıt değişince ilgili URL'ler purge edilsin (ileride)

### C5. Şehir/İlçe + Branş landing zenginleştirme
- [ ] `src/pages/sehirler/[il]/[brans].astro` ve `[il]/[ilce]/[brans].astro` şu an 2 satır içerikle dönüyor. Şunu ekle:
  - H1 + 150-250 kelime özgün açıklama (şehir + branş hakkında otomatik kalıp)
  - Kulüp listesi (kart kart, kulüpten fotoğraf)
  - Branşa özel SSS bloğu (`FAQPage` JSON-LD)
  - "Yakın bölgeler" + "popüler branşlar" iç linkleri
  - Kulüp sayısı 0 ise `<meta name="robots" content="noindex,follow">`
- [ ] İçerik şablonu için `src/lib/seo/landing-copy.ts` (yapılandırılmış metin üretici)

### C6. Görsel alt text denetimi
- [ ] Galeri görsellerinde: `{branş} {şehir} {kulüp} - {ilan adı} - görsel {N}`
- [ ] Logo alt: "SporNerede.net logosu"
- [ ] Branş emoji'leri dekoratif, `aria-hidden="true"`

### C7. Blog/Rehber alanı (long-tail içerik)
- [ ] `/rehber` veya mevcut `/haberler` altında "Rehber" kategorisi
- [ ] İlk 10 makale konusu (long-tail):
  - "Çocuğum için doğru sporu nasıl seçerim?"
  - "5 yaş yüzme kursu fiyatları 2026"
  - "İstanbul'da en iyi karate kulüpleri"
  - "Kış sporlarına başlangıç rehberi"
  - "Spor kulübü açma rehberi: yasal süreç"
  - ...
- [ ] Her makale 800-1500 kelime, 1-2 görsel, iç linkler

---

## 4. Paket D — Operasyonel & İzleme

### D1. Hreflang (gelecek için hazırlık)
- [ ] Şu an sadece `tr-TR`, layout'a `<link rel="alternate" hreflang="tr-TR">` ekle (self-referencing)
- [ ] Çoklu dil açıldığında genişletilebilir

### D2. Trailing slash + canonical disiplini
- [ ] Astro `trailingSlash: 'never'` sabitle (`astro.config.mjs`)
- [ ] Nginx'te `/path/` → `/path` 301 (gerekirse)
- [ ] Parametreli URL'ler için canonical her zaman parametresiz versiyona

### D3. Monitoring + alarm
- [ ] `/api/health?deep=1` zaten mevcut, üzerine:
  - [ ] Sitemap endpoint'leri her gün otomatik kontrol (cron + curl, en az 1 `<url>` var mı)
  - [ ] PageSpeed Insights API ile haftalık Core Web Vitals snapshot → `memory-bank/mvp-metrics.md`'ye log
  - [ ] Search Console API ile haftalık index sayısı + click/impression snapshot

### D4. Crawl bütçesi koruması
- [ ] Parametreli `/ara?il=...&brans=...` URL'leri `noindex` (zaten Disallow)
- [ ] Pagination varsa `rel="next"` `rel="prev"` (Google artık görmezden geliyor ama best practice)

---

## 5. Uygulama Sırası (Sprint Önerisi)

| Sprint | Süre | İçerik |
|---|---|---|
| **Sprint 12.1 — SEO Temeli** | 3-4 gün | Paket A tümü |
| **Sprint 12.2 — Reklama Hazırlık** | 3-4 gün | Paket B (B1, B2, B3, B4) — Pixel/Yandex sonraya |
| **Sprint 12.3 — Performans + Landing içeriği** | 4-5 gün | Paket C (C1, C2, C3, C5, C6) |
| **Sprint 12.4 — İçerik üretim başlangıç** | sürekli | C7 + D1-D4 + içerik takvimi |

---

## 6. Kabul Kriterleri (Faz 12 bitiş kontrolü)

- [ ] PageSpeed Insights — Performance ≥ 90 (mobil), LCP < 2.5s, CLS < 0.1
- [ ] Google Rich Results Test → kulüp, ilan, FAQ, breadcrumb yeşil
- [ ] Search Console → "Geçerli" indeksli sayfa sayısı yeni sayfa eklemelerine paralel artıyor
- [ ] Detay sayfaları slug URL ile erişilebiliyor, sayısal ID'den 301 geliyor
- [ ] Tüm public sayfalarda gerçek 404 (`Astro.redirect` kaldırıldı)
- [ ] KVKK banner çalışıyor, consent reddedildiğinde GA4 hiç ateşlenmiyor (Network sekmesinde doğrula)
- [ ] GTM içinden 10 event'in hepsi GA4 DebugView'da görünüyor
- [ ] 4 yasal sayfa yayında, footer'da link
- [ ] `ads.txt` 200 dönüyor
- [ ] UTM cookie testte tutuyor, formda gizli alan dolu geliyor

---

## 7. Reklama Geçiş Hazırlığı (Faz 13 ön-koşulları)

Faz 12 bittiğinde reklam vermeye geçmek için yapılacaklar:

1. **Google Ads hesabı** aç, GA4 conversion'ları import et (`application_submit`, `lead_phone_click`)
2. **AdSense başvurusu** (eğer site içi reklam yayını da düşünülüyorsa)
3. İlk kampanya türleri:
   - **Search:** "[şehir] [branş] kursu" anahtar kelimeleri → ilgili landing'e (Paket C5 önemli)
   - **Performance Max:** kulüp başvuru CTA'sı → `/basvuru`
   - **Remarketing:** `view_listing` + `view_club` görmüş ama dönüşmemiş kullanıcılar
4. Reklam slotları aktive edilirse `AdSlot.astro` provider değiştirilir

---

## 8. Risk ve Uyarılar

- **Slug değişikliği** sırasında tüm internal linkleri ve cache'i temizle, aksi halde 404 patlaması olur. Önce 301'leri test ortamında doğrula.
- **Consent reddi durumunda** Google Ads remarketing audience'ları doğal olarak küçük kalır. Bu kabul edilen bir maliyet — KVKK uyumu daha önemli.
- **AdSense onayı** için içerik hacmi yetersiz olabilir; önce blog/rehber (C7) ile içeriği güçlendirmek, sonra başvurmak mantıklı.
- **Reklam slotları** önceden eklenirse de **kullanıcı deneyimini bozacak konumlardan kaçın** — özellikle başvuru ve iletişim formunda hiç olmamalı.
- **Search Console'da slug geçişi sonrası** geçici dalgalanma normaldir; 3-6 hafta süreyle eski index düşer, yenisi yükselir.

---

## 9. Hızlı Başlama (İlk Commit)

Plan onaylandıktan sonra atılacak ilk pratik adımlar (1 günlük iş):

1. `public/og-image.png` üret (1200×630, marka uyumlu)
2. `BaseLayout.astro` içine `Organization` + `WebSite` JSON-LD enjekte et
3. `robots.txt`'i sıkılaştır
4. `404.astro` özelleştir + redirect'leri 404'e çevir
5. Sitemap'lere `lastmod` ekle, boş kombinasyonları çıkar

Sonraki adım: slug migration (en büyük tekil iyileştirme).
