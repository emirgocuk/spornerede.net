# SporNerede.net — İlerleme Durumu (Progress)

## Özet Durum

**Faz: Faz 12 (SEO + reklam altyapısı) canlıda; sonraki Faz 13 (reklam yayını)**
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
- `/ara`: Arama sonuçları sayfası (Filtreleme, Mock veri, Responsive kartlar)
- `/basvuru`: Kulüp kayıt formu (Validation, Success state, API entegrasyonu)
- Header: Sticky, sade menü (Haberler/Hakkımızda/İletişim), mobil hamburger desteği; **Üye girişi** → `/panel/giris` (CTA’nın solunda)
- Placeholder: `/panel/giris` (kulüp paneli girişi için zemin)
- Plan: `memory-bank/club-auth-admin-plan.md` (admin shell, onay, belgeler, referans veri CRUD)
- Tasarım: Kırmızı-Beyaz marka kimliği, Outfit font, Modern animasyonlar
- Hero: Şehir rotator badge + yazı tabanlı autocomplete öneri paneli (ilk 3 tahmin)
- Club CTA: Sağ medya vitrin alanı, arka planla geçişli harmanlama

---

## ❌ Ne Henüz Yok / Yapılmadı

### Veri ve Backend

- PocketBase veritabanı kurulumu (Tamamlandı)
- Kullanıcı oturumu: `users`, `sessions`, `club_memberships` (Tamamlandı)
- Başvuru ekleri: `application_documents`, multipart yükleme, güvenli depolama (Tamamlandı)
- Admin arayüzü: başvuru sağ liste + detay + onay/red + onayda kulüp oluşturma (Tamamlandı)
- Kulüp paneli: kurslar, profil yönetimi, geribildirim sistemi (Tamamlandı)
- GitHub deploy key eklendi; sunucuda `/opt/spornerede/repo` clone edildi ve `spornerede-autoupdate.timer` aktif.
- Offsite backup yerine ilk aşamada admin panelden manuel backup indirme modeli seçildi; lokal sunucu backup timer da çalışmaya devam ediyor.
- Canlı SMTP Brevo ile doğrulandı; mail deep health `ok`.

### Ürün Özellikleri

- Gelişmiş filtreleme mantığı (program, seviye, gün) (Sırada)
- Harita entegrasyonu (iframe → interaktif) (Sırada)
- Yorum/puanlama sistemi (Sırada)
- Akıllı eşleştirme quiz'i (Sırada)

### Monetizasyon

- Ücretli üyelik paketleri (Sırada)
- Premium öne çıkarma akışı (Sırada)
- Lead komisyon akışı (Sırada)

---

## 🐛 Bilinen Sorunlar


| Sorun                                      | Durum            | Çözüm                                 |
| ------------------------------------------ | ---------------- | ------------------------------------- |
| Nginx yönlendirme sorunlarının geçmişi var | ✅ Çözüldü        | Cloudflare SSL modu düzenlendi        |
| Astro image sharp pixel limiti             | ✅ Geçici çözüldü | CTA görselleri `img` olarak sunuluyor |


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

### Faz 4 — Gelişmiş Özellikler & Monetizasyon (Faz 12 sonrası)

- Gelişmiş Arama ve Harita entegrasyonu (Mapbox / Leaflet)
- Akıllı eşleştirme quiz'i (Kullanıcılara uygun kurs/kulüp önerisi)
- Yorum/puanlama sistemi (Kulüpler için geri bildirimler)
- Premium profil sistemi (Öne çıkanlar) ve online ödeme altyapısı (Stripe/Iyzico)
- Arama filtrelerinin URL tabanlı sorgu ile derinleştirilmesi

### Faz 13 — Reklam Yayını (Faz 12 ön-koşulları sonrası)

- Google Ads hesabı + GA4 conversion import
- AdSense başvurusu (içerik hacmi yeterli olduğunda)
- İlk kampanyalar:
  - Search: "[şehir] [branş] kursu" → ilgili landing
  - Performance Max: kulüp başvuru CTA → `/basvuru`
  - Remarketing: `view_listing` + `view_club` görmüş dönüşmemiş kullanıcılar

---

## 📝 Plan Güncellemesi (Basit Dokuman Seti)

MVP odağını sade tutmak için aşağıdaki bilgilendirme dokumanlari eklendi:

- `memory-bank/db-schema-plan.md`
- `memory-bank/deploy-runbook.md`
- `memory-bank/mvp-metrics.md`
- `memory-bank/security-privacy.md`
- `memory-bank/seo-ads-plan.md` (Faz 12: SEO + Reklam Hazırlığı tam yol haritası)

Bu set, detayli kurumsal dokumantasyondan ziyade "hemen uygulanabilir adim" odaklidir.