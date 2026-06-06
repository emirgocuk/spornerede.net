# SporNerede.net — İlerleme Durumu (Progress)

## Özet Durum

**Faz: Faz 12 (SEO + reklam altyapısı) canlıda; sıradaki geliştirme sırası: Faz 13 → 14 → 15 → 16 → 17, ardından veya paralel Faz 4 (harita ve derin ürün) ve Faz 18 → 19 → 20 → 21 (SEO Otopilot — Soro benzeri kendi kendine çalışan içerik motoru).** Checklist: `faz-gelistirme-checklist-tr.md`.
**Versiyon:** 0.4.0

Ana takip dosyasi: `memory-bank/faz-gelistirme-checklist-tr.md` (faz bazli [x]/[ ] durum takibi)

---

## ✅ Ne Çalışıyor

### Altyapı

- Astro.js v6 + TailwindCSS v4 sorunsuz çalışıyor
- SSR Modu aktif (@astrojs/node adapter kurulu)
- Sunucu: Ubuntu 22.04 + Nginx + SSL (Cloudflare) aktif
- Domain: spornerede.net erişilebilir
- `npm run dev` → localhost:4321 çalışıyor
- Nodemailer entegrasyonu (API endpoint aktif)
- Sitemap ve robots.txt altyapısı hazır
- `deploy.sh` + `rollback.sh` + systemd ornek unit eklendi (SSR release deploy)
- CI deploy gate + smoke check eklendi (`npm run release:gate`, `npm run smoke:check`)
- `/api/health` endpoint'i deep readiness kontrolune guncellendi (`?deep=1`)
- Canlı sunucu Node 22 + Nginx + systemd ile çalışıyor (`spornerede` service).
- PocketBase canlıda binary/systemd olarak çalışıyor (`spornerede-pocketbase` service).
- Production env sunucuda tutuluyor: `/opt/spornerede/.env`.
- Canlı backup timer aktif: `spornerede-backup.timer`.
- İlk canlı release smoke check geçti: `/`, `/ara`, `/basvuru`, `/api/health?deep=1`.

### Sayfalar & Bileşenler

- `BaseLayout.astro`: Tam SEO ve meta tag desteği
- `index.astro`: Dinamik landing page (Hero, News, FAQ, CTA, Footer)
- `/ara`: Arama sonuçları sayfası (Filtreleme, PocketBase verisi, Responsive kartlar)
- `/basvuru`: Kulüp kayıt formu (Validation, Success state, API entegrasyonu)
- Header: Sticky, sade menü (Haberler/Hakkımızda/İletişim), mobil hamburger desteği; **Üye girişi** → `/panel/giris` (form + korumalı `/panel`; CTA’nın solunda)
- Mimari / genişleme planı: `memory-bank/club-auth-admin-plan.md` (admin shell, onay, belgeler, referans veri CRUD)
- Tasarım: Kırmızı-Beyaz marka kimliği, Outfit font, Modern animasyonlar
- Hero: Şehir rotator badge + yazı tabanlı autocomplete öneri paneli (ilk 3 tahmin)
- Club CTA: Sağ medya vitrin alanı, arka planla geçişli harmanlama

### Veri, backend ve canlı operasyon

- PocketBase veritabanı kurulumu ve canlı çalışma (`spornerede-pocketbase`)
- Kullanıcı oturumu: PocketBase `users` / oturumlar ve kulüp üyelikleri
- Başvuru ekleri: belge yükleme, multipart, güvenli depolama ve admin tarafı
- Admin arayüzü: başvuru listesi + detay + onay/red + onayda kulüp oluşturma
- Kulüp paneli: kurs/program CRUD, profil, geribildirim
- GitHub deploy key; sunucuda `/opt/spornerede/repo` ve `spornerede-autoupdate.timer`
- Offsite backup: ilk aşamada admin panelden manuel indirme; sunucu `spornerede-backup.timer` aktif
- Canlı SMTP (Brevo); mail deep health `ok`

---

## ❌ Ne Henüz Yok / Yapılmadı

> Temel veri ve panel omurgası yukarıda **Ne çalışıyor** altında; aşağıdakiler yol haritası (Faz 4 ve 13–17) ve backlog.

### Ürün Özellikleri

- Gelişmiş filtreleme mantığı (program, seviye, gün) (Sırada)
- Harita entegrasyonu (iframe → interaktif) (Sırada)
- Yorum/puanlama sistemi (Sırada)
- Akıllı eşleştirme quiz'i (Sırada)

### Monetizasyon

- Ücretli üyelik paketleri (Sırada)
- Premium öne çıkarma akışı (Sırada)
- Lead komisyon akışı (Sırada)

### Operasyonel yükü azaltma (backlog önerileri)

Tekrarlayan manuel işi, destek talebini ve yoğun sorgu maliyetini düşürmeye yönelik aday özellikler; ana faz yolu (13–17, Faz 4) ile çakışmadan onay sonrası sprinte alınır. Tam liste ve gerekçeler: `memory-bank/activeContext.md` → bölüm **Operasyonel yükü düşüren backlog (öneri havuzu)**. Özet: kulüp panelinde profil doluluğu + branş seçim/uyarı UX’i; görsel encode ve liste/arama performansı; kayıtlı arama bildirimi ve mini karşılaştırma; başvuru çakışması uyarısı + panel rate limit / güvenlik log’u.

### Gelir ve trafik (strateji öneri havuzu)

Satılabilir B2B/B2C paketler, pazar yeri fikirleri ve SEO ile siteye çekme taktikleri: `memory-bank/growth-revenue-traffic-tr.md`. Uygulama fazları ve sırası: **Faz 13 → 14 → 18–21 (SEO otopilot ücretsiz) → 15 → 16 → 17** (+ Faz 4 epik); detaylı maddeler `memory-bank/faz-gelistirme-checklist-tr.md`. **Organik sıra ve SERP CTR:** `memory-bank/seo-ctr-organic-plan-tr.md`. **Otopilot rehber (0 TL):** `memory-bank/seo-autopilot-plan-tr.md`.

---

## 🐛 Bilinen Sorunlar


| Sorun                                      | Durum            | Çözüm                                 |
| ------------------------------------------ | ---------------- | ------------------------------------- |
| Nginx yönlendirme sorunlarının geçmişi var | ✅ Çözüldü        | Cloudflare SSL modu düzenlendi        |
| Astro image sharp pixel limiti             | ✅ Geçici çözüldü | CTA görselleri `img` olarak sunuluyor |
| Content-engine LLM metinleri basma kalıp   | ✅ Ö1+Ö2+Ö3+Ö4 | Data-grounding + dedup + açı çeşitliliği + **GSC seçici CTR rewrite** (haftada max 2). Plan: `content-engine-isolated-plan-tr.md` |


---

## 📊 Yol Haritası

### Faz 1 — Landing Page & Temel Özellikler ✅

- Component mimarisi kur
- Header + navigasyon (Sticky & Dropdown)
- Hero + arama alanı
- Haber/duyuru bandı
- Branşları keşfet bölümü (landingden kaldırıldı, component mevcut)
- Footer (4 Sütunlu)
- Kulüp başvuru sayfası & API
- SEO (Robots.txt, Sitemap, Meta tags)
- Sıkça Sorulan Sorular bölümü
- Türkiye geneli metin/marka dili revizyonu

### Faz 2 — Arama ve Listeleme ✅

- Arama sonuçları sayfası
- Branş sayfaları (`/branslar` ve `/branslar/[brans]`)
- SEO meta data (Branş bazlı dinamik title)
- Kulüp detay şablonu (`/kulupler/[id]`)

### Faz 3 — Veri Tabanı ve Dinamik İçerik ✅

- PocketBase kurulumu ve entegrasyonu
- Seed altyapısı (`scripts/pb-setup.ts`)
- Seed altyapisi eklendi (`npm run db:seed`)
- Canlıya alma hazırlığı: release gate + post-deploy smoke test + deep health endpoint
- Faz 3A temel şema eklendi: `kullanicilar`, `oturumlar`, `kulup_uyelik_kullanicilari`, `basvuru_belgeleri`
- Faz 3A migration eklendi: `drizzle/0002_faithful_hammer.sql`
- Faz 3A repository iskeleti eklendi: `src/lib/repositories/auth.ts`, `src/lib/repositories/applicationDocuments.ts`
- Faz 3A API eklendi: `/api/panel/login`, `/api/panel/logout`, `/api/panel/session`
- PocketBase geçişi tamamlandı: PostgreSQL ve Drizzle yerine, dahili DB ve yetkilendirme sağlayan tek dosyalık PocketBase yapısına geçildi (`scripts/pb-setup.ts`).
- Tüm API'ler PocketBase ile tam entegre çalışacak şekilde güncellendi.
- Panel login sayfasi aktiflestirildi: `/panel/giris` form + `/panel` korumali alan
- Admin API genisletildi: `/api/admin/applications?id=...` detay + `/api/admin/application-documents`
- Basvuru endpointi guclendirildi: dosya kabul/yerel saklama + belge metaverisi kaydi
- Operasyon scripti eklendi: `npm run user:create -- <email> <password> [admin|club]`
- Admin shell UI aktiflestirildi: liste + detay + durum guncelleme + belge metaverisi ekleme (`/admin`)
- Admin shell UI genisletildi: liste arama + durum filtresi + kalici admin notu
- Panel profil yonetimi eklendi: `GET/POST /api/panel/profile` + `/panel/profil`
- Header auth UX iyilestirildi: oturum acikken "Uye girisi" -> "Panelim"
- Operasyon scripti eklendi: `npm run user:assign-club -- <email> <club-slug> [owner|staff]`
- Panel kurs/program CRUD eklendi:
  - UI: `/panel/kurslar` tam donanımlı form, Tiptap zengin metin editörü, Google Maps lokasyon, Drag & Drop Galeri.
- Public arama entegrasyonu baslatildi:
  - `searchClubs` sonucu kulup bazli aktif program ozeti uretiyor
  - `/ara` kartlarinda program ozeti gosterimi eklendi
- Kulup detay sayfasi programlarla genisletildi:
  - `getClubProgramsByClubId` repository fonksiyonu eklendi
  - `/kulupler/[id]` icinde aktif program listesi gösteriliyor
- İlan (Program) detay sayfası oluşturuldu (`/ilanlar/[id]`) ve public tarafta görünür hale getirildi.
- Metrics endpoint genisletildi: `clubsWithPrograms`
- Mock veri fallbacklari core repository akislarindan kaldirildi (DB zorunlu)
- Role-scope sertlestirme baslatildi:
  - Panel API'lerinde rol guard (`club/admin`) zorunlu
  - Admin API auth, admin session + token fallback destekli
- Panel yetki edge-case sertlestirildi:
  - Onayli kulup uyeligi olmayan hesaplar panel alanina alinmiyor
  - `mustChangePassword` varken panel API erisimi bloklaniyor
- Admin onboarding akisi eklendi:
  - Endpoint: `POST /api/admin/provision-club-user`
  - Admin UI: kulup detayinda "Kullanici Olustur/Guncelle" bolumu
  - Islev: kulup kullanicisi olusturur/gunceller + kulube baglar
- Admin belge indirme akisi eklendi:
  - Endpoint: `GET /api/admin/application-document-download?documentId=...`
  - Admin UI: belge satirina "Belgeyi indir" linki eklendi
  - Yerel disk dosyasi güvenli yol kontrolu ile stream ediliyor
- Provisioning sonrasi bilgilendirme maili eklendi:
  - `src/lib/mail/onboarding.ts`
  - `POST /api/admin/provision-club-user` mail gondermeyi dener, hata varsa `mailWarning` dondurur
- Guvenlik adimi eklendi: ilk giriste zorunlu sifre degistirme
  - `POST /api/panel/change-password`
  - `GET /panel/sifre-degistir`
  - Geçici şifreyle login sonrası zorunlu yönlendirme
- İletişim Formu Admin Entegrasyonu:
  - Admin panelinde `İletişim Formu` sekmesi (Okundu / Okunmadı / Cevaplandı)
- Geribildirim Sistemi (Feedback Widget):
  - Tüm panel sayfalarının sağ alt köşesinde geribildirim butonu
  - Admin panelde `Geribildirimler` sekmesi üzerinden yönetimi
- Tasarim/UX iyilestirme turu tamamlandı (panel + public sayfalar):
  - Panelde arayuz duzenleri revize edildi: `/panel`, `/panel/kurslar`, `/panel/profil`
  - Kurslar sayfası listeleme görünümü ve ilan tasarımları yenilendi (`pcard` UI komponentleri)
  - Public deneyimde listeleme/detay sunumu guncellendi: `/ara`, `/branslar/[brans]`, `/kulupler/[id]`, `/ilanlar/[id]`
- Self-hosted mail kuyruğu, form bildirimleri ve "şifremi unuttum" akışı eklendi (`mail_kuyrugu` & Mailpit desteği).
- Haberler yönetimi (`haberler` tablosu) eklendi, landing sayfasındaki bileşenler (Haberler, Branşlar) admin panelinden/veritabanından yönetilir hale getirildi.
- Uygulamadaki tüm mock veri kullanımları (basvuru.astro, sitemap dosyaları) temizlenip veritabanına bağlandı (canlıya çıkışa hazır).
- Canlıya alma ilk turu tamamlandı:
  - Sunucu: `root@45.155.19.82`
  - Node: `v22.22.2`
  - App service: `spornerede`
  - PocketBase service: `spornerede-pocketbase`
  - Backup timer: `spornerede-backup.timer`
  - Current release: `/opt/spornerede/current`
  - PocketBase data: `/opt/spornerede/pocketbase/pb_data`
  - PocketBase public/uploads: `/opt/spornerede/pocketbase/pb_public`
- Production secret bilgileri repoya yazılmaz; sunucuda root-only olarak `/opt/spornerede/production-credentials.txt` içinde tutulur.
- Astro SSR deploy modeli düzeltildi: release içine `dist/` yanında `package.json`, `package-lock.json` ve production `node_modules` gerekir.
- Runtime env önceliği düzeltildi: canlıda `process.env` değerleri build-time `import.meta.env` değerlerinin önüne geçer.
- Brevo SMTP canlıya bağlandı:
  - `MAIL_FROM=no-reply@spornerede.net`
  - `MAIL_TO=info@spornerede.net`
  - Canlı mail queue testi `processed:1`, `sent:1`, `failed:0`
- Admin panelde `Yedekler` sekmesi eklendi:
  - `pb_data` ve `pb_public` arşivlenip indiriliyor.
  - `.env`, SMTP key, admin token gibi secret dosyalar arşive dahil edilmiyor.
  - Canlı endpoint testi 200 döndü ve arşiv içeriği doğrulandı.

### Faz 11 — Canlı Operasyon ve Güncelleme Akışı 🚧

- Elle canlı deploy başarılı ve smoke check temiz.
- Yeni versiyon yayınlama standart yolu:
  1. Lokalde değişiklikleri tamamla.
  2. `npm run build` çalıştır.
  3. Gerekirse `npm run release:gate` ve `npm run smoke:check` için `SITE_URL` ayarla.
  4. Değişiklikleri `main` branch'e push et.
  5. GitHub deploy key eklendikten sonra sunucu timer yeni commit'i otomatik çeker.
  6. Timer hazır değilse geçici elle deploy: `npm run build` sonrası `deploy.sh` veya mevcut Windows `ssh/scp` release akışı.
  7. Deploy sonrası `SITE_URL=https://spornerede.net npm run smoke:check` eşdeğeri kontrol yapılır.
- Auto-update tamamen açılmadan önce yapılacak:
  - GitHub deploy key'i repo `Deploy keys` bölümüne ekle.
  - Sunucuda `/opt/spornerede/repo` clone et.
  - `spornerede-autoupdate.service/timer` etkinleştir.
  - `systemctl start spornerede-autoupdate.service` ile elle test et.

### Faz 12 — SEO Güçlendirme + Reklam Altyapısı ✅ (2026-05-12)

Detaylı plan: `memory-bank/seo-ads-plan.md`. Tüm altyapı turu tek seferde tamamlandı; build temiz geçti.

**Sprint 12.1 — Paket A: SEO Temeli** ✅
- [x] Slug tabanlı URL'ler: `/ilanlar/<slug>-<id>`, `/kulupler/<slug>-<id>` + sayısal id'den 301 redirect. PocketBase şeması değişmedi (slug runtime'da `news` repo pattern'i ile üretiliyor: `src/lib/seo/slug.ts`).
- [x] `BaseLayout`'a global JSON-LD: `Organization` + `WebSite` (sitelinks searchbox).
- [x] `Breadcrumb.astro` component + `BreadcrumbList` JSON-LD (BaseLayout `breadcrumbs` prop'u ile otomatik).
- [x] Kulüp detay → `SportsActivityLocation` + `LocalBusiness` (multi-type) + her aktif program için `Course` schema dizisi.
- [x] İlan detay → `Course` schema (provider, offer, courseInstance, location, geo).
- [x] `FAQSection` → `FAQPage` JSON-LD.
- [x] `/ara` → `ItemList` JSON-LD (filtre uygulanmışsa `noindex` + canonical `/ara`).
- [x] Şehir/branş ve şehir/ilçe/branş landing → `ItemList` + zenginleştirilmiş içerik; boş kombinasyon `noindex`.
- [x] OG image: statik `og-image.png` (sharp + SVG kaynak) + dinamik `/api/og.png?title=&kicker=&badge=` endpoint'i. Detay sayfaları otomatik kullanıyor.
- [x] Gerçek 404 davranışı (tüm `Astro.redirect('/ara')` kaldırıldı).
- [x] Özel `404.astro` — arama formu + popüler branşlar + gerçek `status: 404`.
- [x] `robots.txt` sıkılaştırıldı: admin/panel/api/basvuru/uploads + `?utm_*` `?fbclid=` `?gclid=` engelleniyor; AI tarayıcıları (GPTBot, CCBot, anthropic-ai, Google-Extended) `Disallow: /`.
- [x] Sitemap'lere `lastmod` + `priority` + `changefreq` eklendi (`src/lib/seo/sitemap.ts`); boş kombinasyonlar çıkarıldı; sitemap'ler 1 saat CDN cache + SWR.

**Sprint 12.2 — Paket B: Reklam Altyapısı** ✅
- [x] `ConsentBanner.astro` — KVKK uyumlu, Google Consent Mode v2 default `denied`, 3 kategori, LocalStorage 12 ay, "Tümünü kabul / Reddet / Yönet" akışı.
- [x] GTM kurulumu (`PUBLIC_GTM_ID` env-driven) + GA4 fallback (`PUBLIC_GA4_ID`) — set değilse hiç enjekte edilmiyor.
- [x] 10 conversion event helper'ı tanımlandı (`src/lib/analytics/track.ts`).
- [x] Otomatik link/form dinleyici (`TrackingAutoListeners.astro`): `tel:`, `mailto:`, Google Maps, başvuru/iletişim form submit, UTM yakalama (30 gün `sn_attribution` cookie).
- [x] `/api/internal/track` server-side first-party mirror (sendBeacon kabul ediyor, structured stdout JSON log).
- [x] 4 yasal sayfa yayında: `/gizlilik-politikasi`, `/cerez-politikasi`, `/kvkk-aydinlatma-metni`, `/kullanim-kosullari`. Footer'a hepsi linklendi.
- [x] CLS-safe `AdSlot.astro` component (leaderboard / rectangle / skyscraper / feed). `PUBLIC_AD_PROVIDER` env aktif edilince görünür.
- [x] `public/ads.txt` placeholder (IAB referansıyla).
- [ ] **Eksik / sonra:** Bing Webmaster + Yandex Webmaster doğrulama, admin başvuru detayında UTM atıf gösterimi.

**Sprint 12.3 — Paket C: Performans + İçerik** ✅ (külistik kısımlar bitti)
- [x] Outfit font self-host'a alındı (`scripts/copy-fonts.mjs` + `src/styles/fonts.css`). 7 ağırlık × latin + latin-ext woff2. Google Fonts `<link>` kaldırıldı.
- [x] LCP font preload (`<link rel="preload">` for 400 + 700 woff2).
- [x] `dns-prefetch` + `preconnect` network ipuçları (`googletagmanager`, `google-analytics`).
- [x] Astro `prefetch: hover` aktif.
- [x] `src/middleware.ts` — Cloudflare/Nginx cache header'ları (liste sayfaları `s-maxage=300-600 swr=3600`, sitemap `s-maxage=3600 swr=86400`, admin/panel/api `private no-store`).
- [x] Güvenlik header'ları (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`) HTML response'lara global.
- [x] Şehir/branş + şehir/ilçe/branş landing'ler zenginleştirildi (breadcrumb, hero, popüler ilçe chip listesi, kulüp kart listesi, bilgilendirici metin); boşlar `noindex`.
- [x] Galeri görsellerine `decoding="async"` + `width/height` + açıklayıcı alt text.
- [ ] **Eksik:** `astro:assets` `<Image>` migration — galeri görselleri ImgBB üzerinden runtime URL'lerle geldiği için bypass edildi; sadece statik public görseller için anlamlı, ileride yapılabilir.

**Sprint 12.4 — Paket D: Operasyonel** (kısmi ✅)
- [x] `hreflang="tr-TR"` + `x-default` self-referencing.
- [x] `trailingSlash: 'never'`.
- [ ] **Eksik / sonra (içerik işi):** Long-tail rehber/blog içerik turu (haftada 1-2 yazı), PageSpeed Insights API otomasyonu, Search Console API entegrasyonu, Bing/Yandex doğrulama.

**Yeni Dosyalar:**
- `src/lib/seo/jsonld.ts`, `src/lib/seo/slug.ts`, `src/lib/seo/sitemap.ts`, `src/lib/analytics/track.ts`
- `src/middleware.ts`
- `src/components/{ConsentBanner,GoogleTagManager,GoogleTagManagerNoscript,TrackingAutoListeners,AdSlot,Breadcrumb}.astro`
- `src/pages/{404.astro,gizlilik-politikasi.astro,cerez-politikasi.astro,kvkk-aydinlatma-metni.astro,kullanim-kosullari.astro}`
- `src/pages/api/{og.png.ts,internal/track.ts}`
- `src/styles/fonts.css`
- `public/{ads.txt,og-image.svg,og-image.png,fonts/outfit/*.woff2}`
- `scripts/{generate-og-image.mjs,copy-fonts.mjs}`

**`.env.example` Yeni Anahtarlar:**
- `PUBLIC_GTM_ID`, `PUBLIC_GA4_ID`, `INTERNAL_TRACK_TOKEN`, `PUBLIC_AD_PROVIDER`

**Kabul Kriterleri (canlıya alma sonrası ölçülecek):**
- [ ] PageSpeed Insights (mobil) Performance ≥ 90, LCP < 2.5s, CLS < 0.1 (altyapı hazır, ölçüm canlıda)
- [ ] Google Rich Results Test → kulüp, ilan, FAQ, breadcrumb yeşil (canlıda doğrula)
- [x] Detay sayfaları slug ile erişiliyor, sayısal ID'lerden 301
- [x] `Astro.redirect('/ara')` tüm rotalardan kaldırıldı
- [ ] KVKK reddinde GA4 hiç ateşlenmiyor (production GTM ID set edilince doğrulanacak)
- [ ] GTM DebugView'da 10 event görünüyor (production'da)
- [x] 4 yasal sayfa yayında + footer linklenmiş
- [x] `ads.txt` placeholder erişilebilir
- [x] UTM cookie + auto track listener çalışıyor (`/api/internal/track` log basıyor)

### Faz 13 — Reklam yayını ve ölçüm (sıradaki)

- Google Ads hesabı + GA4 conversion import
- AdSense başvurusu (içerik hacmi yeterli olduğunda)
- İlk kampanyalar:
  - Search: "[şehir] [branş] kursu" → ilgili landing
  - Performance Max: kulüp başvuru CTA → `/basvuru`
  - Remarketing: `view_listing` + `view_club` görmüş dönüşmemiş kullanıcılar

### Faz 14 — SEO: indeks, içerik, programatik sayfalar

- Bing ve Yandex doğrulama + sitemap; Search Console haftalık rutin (operasyon şablonu)
- Uzun kuyruk rehber mimarisi + ilk içerik seti
- Şehir / ilçe / branş landing zenginleştirme (benzersiz blok + SSS + iç link)
- Haber ve ilanlardan hub sayfalarına iç linkleme
- JSON-LD: NewsArticle, HowTo/FAQ, Event (içerik tiplerine göre)
- Görsel arama: dosya adı + `alt` disiplini (kod veya yayın kuralı)

### Faz 15 — Organik trafik ürünleri

- Mini branş / uygunluk testi → paylaşılabilir `/ara` URL
- Sezonluk hub sayfası + sahiplik notu
- Bülten kayıt + lead magnet + gönderim MVP
- UTM şablonları ve GA4 kanal raporlaması (`mvp-metrics.md` ile hizalı)

### Faz 16 — E-E-A-T, güven, dağıtım

- Hakkımızda / İletişim güven sinyali (kim, nasıl ulaşılır)
- Rehber/haber: yazar ve tarih alanları
- Doğrulanmış kulüp süreci taslağı (Faz 17 ile faturalandırma bağlanır)
- İş ortaklığı / basın şablonu; topluluk ve QR için iç kılavuz (etik dağıtım)

### Faz 17 — Gelir modeli MVP

- Öne çıkan / sponsor sıralama + ölçüm
- Kulüp paket kotası ve özellik bayrakları
- Lead veya tıklama kredisi (sayaç ve rapor MVP)
- Panelde trafik/lead özeti; Iyzico veya Stripe iskeleti
- İsteğe bağlı: kayıtlı arama uyarısı, 2–3 kulüp karşılaştırma MVP

### Faz 4 — Gelişmiş ürün (büyük epik; 13–17 sonrası veya paralel)

> Premium öne çıkarma ve ödeme iskeleti **Faz 17**ye taşındı; Faz 4 ağırlık olarak harita, tam quiz, yorum ve derin filtre.

- Gelişmiş Arama ve Harita entegrasyonu (Mapbox / Leaflet)
- Tam kapsamlı akıllı eşleştirme quiz'i (Faz 15’teki mini testten ayrı)
- Yorum/puanlama sistemi (moderasyon + KVKK)
- Arama filtrelerinin URL tabanlı sorgu ile derinleştirilmesi

**Önerilen sıra (özet):** 13 → 14 → 15 → 16 → 17 → (kaynak planına göre) Faz 4; ardından paralel veya sıralı **Faz 18 → 19 → 20 → 21 (SEO Otopilot)**. Ayrıntılı `[ ]` maddeler: `memory-bank/faz-gelistirme-checklist-tr.md`. Strateji ve taktik havuzu: `memory-bank/growth-revenue-traffic-tr.md`.

---

## SEO Otopilot (MVP · Ücretsiz — 0 TL/ay)

> Teknik plan: `memory-bank/seo-autopilot-plan-tr.md` · İzole uygulama: `content-engine/` · `memory-bank/content-engine-isolated-plan-tr.md`

**Profil:** `SEO_USE_PAID_APIS=false` — LLM: **OpenRouter `:free` sabit model** (Gemini/Google AI Studio yok; fatura sızıntısı riski). GSC + PocketBase/Astro. Günde **1** taslak → admin düzenler → yayın. **Haftalık:** Pazartesi 04:00 GSC keyword sync + 04:10 düşük CTR haber rewrite (max 2).

> **İçerik özgünlüğü (basma kalıp) iyileştirmesi:** Üretilen metinlerin birbirine benzemesi sorununun kök neden analizi ve MVP planı (Faz Ö1 data-grounding + dolgu paragrafı kaldırma + iskelet gevşetme → Ö2 dedup gate + çeşitlilik → Ö3) `memory-bank/content-engine-isolated-plan-tr.md` içinde. Aktif odak: `activeContext.md`.

### Faz 18 — Keyword kuyruğu (ücretsiz)

**Amaç:** Yazılacak anahtar kelimeleri önceliklendirmek.

**Kaynaklar (0 TL):**
- Google Search Console API — impression ≥ 50, CTR < %3 öncelik
- `scripts/seo-autopilot/seed-keywords-tr.json` (~130 seed)
- PocketBase şehir × branş programatik üretim

**Çıktı:** `seo_keywords` (skor = GSC impression + niyet + iç link potansiyeli)

**Dosyalar:** `keyword-engine.ts`, `seed-keywords-tr.json`, `seo-keyword-weekly.timer`

---

### Faz 19 — İçerik pipeline (OpenRouter `:free`)

**Amaç:** Günde 1 Türkçe SEO **taslağı** (kalite admin + site verisi ile tamamlanır).

**Adımlar:**
1. En yüksek skorlu keyword
2. Site bağlamı (kulüp/program sayısı — PB)
3. İç link listesi
4. OpenRouter sabit `:free` model → `rehber_yazilari` (`incelemede`)
5. Parse fail → 1 retry; `429` → ertesi gün

**`.env`:** `OPENROUTER_API_KEY`, `SEO_OPENROUTER_MODEL=…:free`, `SEO_LLM_PROVIDER=openrouter`, `SEO_GSC_*` — **`SEO_GEMINI_API_KEY` yok**

**Dosyalar:** `content-pipeline.ts`, `llm-openrouter.ts`, `prompts/*.txt`, `seo-content-daily.timer`

---

### Faz 20 — Yayın ve teknik SEO

**Amaç:** Onaylanan taslakları sitenin `/rehber/` bölümünde yayınlamak; tam teknik SEO otomasyonu.

**Yeni Sayfalar:**
- `src/pages/rehber/index.astro` — Hub sayfası (kategori bazlı liste, SEO açıklaması)
- `src/pages/rehber/[slug].astro` — Tek makale (JSON-LD, CTA, ilgili makaleler, E-E-A-T)
- `src/pages/rehber/[kategori]/index.astro` (opsiyonel, Faz 21'de eklenebilir)

**Her Makale Sayfasında:**
- `Article` + `FAQPage` / `HowTo` JSON-LD (schema_tipi'ne göre dinamik)
- Breadcrumb: Ana Sayfa → Rehber → Kategori → Başlık
- CTA bloku: "Bu branşta yakınındaki kulüpleri bul →" (→ `/ara?brans=X&il=Y`)
- İlgili makaleler: aynı kategoriden 3 öneri
- Yazar: "spornerede.net Editörü" + yayınlanma tarihi (E-E-A-T)
- OG image: `/api/og.png?title=&kicker=Rehber&badge=` (zaten mevcut endpoint)
- Sitemap'e otomatik dahil (mevcut sitemap altyapısı ile)

**Admin Paneli:**
- Yeni "SEO İçerik" sekmesi (taslak/yayında/arşiv listesi)
- TipTap editörle düzenleme
- "Yayınla" / "Arşivle" akışı
- Onay bekleyen taslak sayısı dashboard widget'ı

**Dosyalar:**
- `src/pages/rehber/` (yeni)
- `src/lib/repositories/seoArticles.ts`
- Admin paneli SEO İçerik sekmesi (`admin.astro` genişletmesi)

---

### Faz 21 — SEO Otopilot: Ölçüm, Geri Bildirim ve Öğrenen Döngü

**Amaç:** Yayınlanan makalelerin Google performansını takip edip sistemi kendi kendine iyileştiren geri bildirim döngüsü.

**Haftalık GSC Sync:**
- Her Pazartesi çalışır, tüm `/rehber/*` sayfaları için tıklama/gösterim/konum çeker
- `rehber_yazilari.gsc_*` alanlarına günceller
- Admin dashboardunda haftalık özet

**Akıllı Kararlar (Otomatik):**
- **Yüksek gösterim + düşük CTR:** Başlık / meta açıklama varyantı öner
- **>50 tıklama/hafta:** Aynı kategoriden 2 yeni keyword öner (genişletme)
- **4 hafta + <10 gösterim:** `dusuk_performans` işaretle, yeniden yazma kuyruğuna al

**Raporlama:**
- `scripts/seo-autopilot/gsc-reporter.ts`
- Admin dashboard: toplam makale, bu hafta tıklama/gösterim, top 5 makale, bekleyen onay

**Dosyalar:**
- `scripts/seo-autopilot/gsc-reporter.ts`
- `systemd/seo-gsc-weekly.service` + `.timer`

---

## 📝 Plan Güncellemesi (Basit Dokuman Seti)

MVP odağını sade tutmak için aşağıdaki bilgilendirme dokumanlari eklendi:

- `memory-bank/db-schema-plan.md`
- `memory-bank/deploy-runbook.md`
- `memory-bank/mvp-metrics.md`
- `memory-bank/security-privacy.md`
- `memory-bank/seo-ads-plan.md` (Faz 12: SEO + Reklam Hazırlığı tam yol haritası)
- `memory-bank/growth-revenue-traffic-tr.md` (gelir + SEO/trafik taktikleri; Faz 14–17 ile eşlenen strateji havuzu)
- `memory-bank/seo-ctr-organic-plan-tr.md` (organik sıra + CTR: GSC analizi, programatik meta şablonları, FAQ/şema disiplini, görsel SEO, ölçüm; **LLM şart değil**)
- `memory-bank/seo-autopilot-plan-tr.md` (Faz 18–21: SEO otopilot MVP **ücretsiz** — OpenRouter `:free`)
- `memory-bank/content-engine-isolated-plan-tr.md` + `content-engine/README.md` (site kodundan izole paket)

Bu set, detayli kurumsal dokumantasyondan ziyade "hemen uygulanabilir adim" odaklidir.