# SporNerede.net — Aktif Bağlam (Active Context)

## Şimdiki Çalışma Odağı

**Faz 12 (SEO + reklam altyapısı) canlıda + PageSpeed-feedback iyileştirmeleri uygulandı + Consent banner Türkçe karakter düzeltmesi.**

Mevcut durum: Faz 12 kodu `main` üzerinde; production'da `spornerede-autoupdate` ile release alındı (son release: `20260513T185315Z`). ConsentBanner'da ASCII Türkçe yazılan tüm metinler doğru karakterlere çevrildi: "Çerez Tercihleri", "Yönet", "Tümünü Kabul Et", "Gerekli" (Zorunlu yerine), "devre dışı bırakılamaz", "kullanım verileri", "kampanyalarını", "Çerez/Gizlilik Politikamızı". PageSpeed Lab raporundan gelen bulgular (Lighthouse 13 / Performance 100, A11y 91, BP 96, SEO 92) tek tek giderildi:

- ClubCTA görselleri sharp ile yeniden encode edildi (23 MB → 83 KB). Asset import + düz `<img>` ile `/_astro/<hash>.webp` üzerinden 1y immutable cache.
- `/api/panel/session` çağrısı Header'da hint cookie + `requestIdleCallback` ile kritik yoldan çıktı; anonim ziyaretçide tetiklenmiyor (login/logout endpoint'leri non-HttpOnly `spornerede_session_hint` cookie set/clear ediyor).
- Self-hosted font dosyaları nginx location bloğu ile 1y immutable (Node adapter default 4h değerini override).
- `/_astro/*` hashli build çıktıları middleware'da 1y immutable (force-override).
- GTM/GA preconnect link'leri sadece `PUBLIC_GTM_ID` veya `PUBLIC_GA4_ID` set ise enjekte ediliyor (Lighthouse "unused preconnect" temizliği).
- Hero typeahead input'larına `role="combobox"` (ARIA combobox pattern).
- Header CTA marka metni saf beyaz + Footer copyright/tagline WCAG AA kontrast.
- Hero highlight shimmer animasyonu kaldırıldı (non-composited uyarısı).

Sunucudaki repo-temiz olmayan senaryolar giderildi. **Otomatik guncelleme betigi (`deploy/server-auto-update.sh`)**: `git pull` betigin kendisini guncellerken bash'in repo dosyasindan satir satir okumasi **inode/offset kaymasi** yaratiyordu (journal'da `Broken pipe` + yanlis `spornerede.service bulunamadi`). Cozum: calisma `/tmp` altina kopyalanan betikten yurur (`SN_AUTOUPDATE_TMP_RUN`); ardından `systemctl restart spornerede.service` dogrudan cagrılır. Eski `AUTO_UPDATE_RESPAWNED` + ayni yoldan `exec` kaldirildi.

Beklenen (kullanıcı aksiyonu): **Cloudflare Dashboard → Bots → AI Audit / Content Signal Policy → "Append to robots.txt" kapat** — `Content-Signal: search=yes,ai-train=no` direktifi Cloudflare tarafından otomatik ekleniyor ve Lighthouse 13 "unknown directive" diyor. SEO skoru 92 → ~97 etkisi var.

Sonraki adımlar: geliştirme sırası **Faz 13 → 14 → 15 → 16 → 17**, ardından veya paralel **Faz 4** (harita ve derin ürün epik). Checklist: `memory-bank/faz-gelistirme-checklist-tr.md`. Özet yol haritası: `memory-bank/progress.md`, `memory-bank/seo-ads-plan.md`, `memory-bank/growth-revenue-traffic-tr.md`. Operasyonel yükü düşürmeye yönelik aday backlog: bu dosyada **Operasyonel yükü düşüren backlog (öneri havuzu)**; özet: `memory-bank/progress.md`.

## Güncel Görevler (Öncelik Sırasıyla)

### ✅ Tamamlanan

- Astro.js + TailwindCSS 4 kurulumu
- Sunucu altyapısı (Nginx + Cloudflare + SSL)
- Memory Bank dosyaları oluşturuldu
- `global.css` — Tam tema token sistemi ve animasyonlar
- `BaseLayout.astro` — SEO ve Meta altyapısı
- Bileşenler: `Header`, `Hero`, `NewsBar`, `BranslarGrid`, `ClubCTA`, `Footer`
- Sayfalar: `index.astro` (Landing), `ara.astro` (Arama), `basvuru.astro` (Form)
- API: `/api/basvuru` (Nodemailer entegrasyonu)
- SEO: `robots.txt`, `sitemap` ve meta taglar
- Mobil responsiveness ve micro-animations

### 🚧 Devam Eden

- Hero autocomplete: klavye ile tamamlama (yukarı/aşağı/enter)
- Club CTA sağ medya geçişi: son dokunuşlar

**Ana geliştirme sırası:** Faz **13** (reklam yayını ve ölçüm) → 14 → 15 → 16 → 17; ardından veya paralel **Faz 4** (harita, tam quiz, yorum, derin filtre). Faz 11 deploy omurgası, Faz 2–3 veri/panel/admin işleri tamamlandı; ayrıntılı `[ ]` maddeler: `memory-bank/faz-gelistirme-checklist-tr.md`.

### 🆕 Son Tamamlanan (UI Revizyon Paketi)

- Header navigasyon sadeleştirildi (`Haberler`, `Hakkımızda`, `İletişim`)
- Türkiye geneli metin dili uygulandı (Ankara odaklı metinler temizlendi)
- Hero badge şehir rotator tasarımı güncellendi (14ch kutu, center align)
- Hero arama alanı yazı tabanlı öneri paneline geçirildi (ilk 3 tahmin)
- Native `datalist` dropdown iptal edildi, custom suggestion panel aktif
- Landing'e `Sıkça Sorulan Sorular` bölümü eklendi
- Club CTA sağ medya alanı eklendi, arka planla geçişli bütünlük sağlandı
- Footer logo yeni marka stiline güncellendi

### 🆕 Son Tamamlanan (Faz 2.1)

- Drizzle config komutlari guncellendi (`db:generate`, `db:migrate`)
- Ilk migration seti uretildi (`drizzle/0000_`*, `drizzle/0001_`*)
- `kulupler` tablosu icin temel index ve unique slug tanimlari eklendi
- `db:seed` komutu eklendi (`scripts/db-seed.ts`)
- DB client ortam degiskeni erisimi Astro + Node script uyumlu hale getirildi

### 🆕 Son Tamamlanan (Deploy otomasyonu)

- GitHub Actions deploy workflow kapatildi (billing kisitlari nedeniyle)
- Sunucu tarafi pull modeli eklendi:
  - `deploy/server-auto-update.sh`
  - `deploy/spornerede-autoupdate.service.example`
  - `deploy/spornerede-autoupdate.timer.example`
- Deploy runbook self-host timer modeliyle guncellendi

### 🆕 Son Tamamlanan (Faz 3A — backend temel)

- Auth tablolari eklendi: `kullanicilar`, `oturumlar`, `kulup_uyelik_kullanicilari`
- Basvuru belge tablosu eklendi: `basvuru_belgeleri`
- Migration eklendi: `drizzle/0002_faithful_hammer.sql`
- Repository iskeletleri eklendi:
  - `src/lib/repositories/auth.ts`
  - `src/lib/repositories/applicationDocuments.ts`

### 🆕 Son Tamamlanan (Faz 3A — endpoint entegrasyonu)

- Panel auth API eklendi:
  - `POST /api/panel/login`
  - `POST /api/panel/logout`
  - `GET /api/panel/session`
- Session cookie yardimcilari eklendi: `src/lib/auth/session.ts`
- Sifre hash dogrulama yardimcilari eklendi: `src/lib/auth/password.ts` (pbkdf2)
- Panel rotalari guncellendi:
  - `/panel/giris` artik gercek login formu
  - `/panel` oturum gerektiren korumali placeholder
- Admin API detaylandirildi:
  - `GET /api/admin/applications?id=...` tek basvuru detay
  - `GET/POST /api/admin/application-documents`
- Basvuru API iyilestirildi:
  - Zorunlu alan ve e-posta dogrulama akisi sadeleştirildi
  - Dosya yukleme kabul edildi (`documents`)
  - Yerel diske kayit + `basvuru_belgeleri` metaveri kaydi
- Operasyon scripti eklendi:
  - `npm run user:create -- <email> <password> [admin|club]`

### 🆕 Son Tamamlanan (Faz 3C — admin shell iyilestirme)

- `/admin` ekranina arama + durum filtreleme eklendi
- Basvuru detayina kalici `admin notu` alani eklendi
- `kulupler.admin_notu` alanı eklendi (`drizzle/0003_sturdy_signal.sql`)
- Durum guncelleme API akisi admin notu ile birlikte kayit edecek sekilde genisletildi

### 🆕 Son Tamamlanan (Faz 3B — panel profil akisi)

- `GET/POST /api/panel/profile` endpointleri eklendi
- `/panel/profil` sayfasi eklendi (kulup profil duzenleme)
- Panel anasayfasina profil kisayolu eklendi
- Header auth UX guncellendi:
  - Oturum acikken "Uye girisi" baglantisi otomatik "Panelim" olur
- Test onboarding icin yeni operasyon scripti:
  - `npm run user:assign-club -- <email> <club-slug> [owner|staff]`

### 🆕 Son Tamamlanan (Faz 3B — kurs/program CRUD)

- `kulup_programlari` tablosu eklendi (`drizzle/0004_bright_morning.sql`)
- Panel API eklendi: `GET/POST/PUT/DELETE /api/panel/programs`
- Panel UI eklendi: `/panel/kurslar` (liste + ekle + duzenle + sil)
- `/panel` anasayfasina kurs/program yonetimi kisayolu eklendi

### 🆕 Son Tamamlanan (Faz 2.2/Faz 3B baglantisi — public arama)

- `catalog.searchClubs()` icinde kulup bazli aktif programlar sorgulanip ozetleniyor
- `/ara` kartlari program ozeti gosterecek sekilde guncellendi
- Panelde girilen kurs/program verisi public arama deneyimine baglanmaya basladi

### 🆕 Son Tamamlanan (Public detay guclendirme)

- `getClubProgramsByClubId(clubId)` eklendi (mock + DB uyumlu)
- `/kulupler/[id]` sayfasi aktif program listesi gosterecek sekilde genisletildi
- `/api/metrics` icine `clubsWithPrograms` metriği eklendi

### 🆕 Son Tamamlanan (Release guvenligi + demo hazirlik)

- Panel API'lerinde rol guard eklendi (`club/admin`)
- Admin API auth, admin session rolunu destekleyecek sekilde guncellendi (token fallback korunuyor)
- Demo seed scripti eklendi: `npm run demo:seed`
- Yeni checklist/guardrail dokumanlari eklendi:
  - `memory-bank/demo-ready-checklist-tr.md`
  - `memory-bank/go-live-guardrails.md`
- Admin onboarding endpointi eklendi:
  - `POST /api/admin/provision-club-user`
  - Kulup kullanicisi olusturma/guncelleme + kulup uyeligi atama
  - Admin UI detay paneline baglandi
- Admin belge indirme endpointi eklendi:
  - `GET /api/admin/application-document-download`
  - Admin detay ekraninda belge satirindan indirme linki
- Ilk giriste sifre degistirme akisi eklendi:
  - `kullanicilar.sifre_degistirme_zorunlu`
  - `POST /api/panel/change-password`
  - `/panel/sifre-degistir`
  - Geçici şifreli hesaplar panel alanlarına gitmeden önce şifre yeniler

### 🆕 Son Tamamlanan (Tasarim revizyonu turu)

- Panel tarafinda duzen/polisaj guncellemeleri yapildi:
  - `/panel`, `/panel/kurslar`, `/panel/profil`
- Admin ve panel akisinda medya/program yonetimi genisletildi (drag-drop galeri, tiptap editör, gün/saat takvim girişleri).
- Public deneyimde kart/detay sunumu guncellendi (ilan tasarımının public tarafa yansıması).
- Panel genelinde "Geribildirim" sistemi eklendi (sağ alt köşe widget).
  - Admin panelde "Geribildirimler" tabı eklendi.
- İletişim formu mesajlarına admin panelden "Cevaplandı" özelliği eklendi.
- PostgreSQL / Drizzle ORM'den daha hızlı ve entegre bir çözüm olan **PocketBase** altyapısına geçiş yapıldı.
  - Kurulum scriptleri (`pb-setup.ts`), db seed işlemleri uyumlu hale getirildi.

### 🆕 Son Tamamlanan (Faz 3D — Mail Altyapısı & Şifremi Unuttum)

- Self-hosted mail kuyruğu altyapısı kuruldu (`mail_kuyrugu` tablosu).
- Şifre sıfırlama token sistemi eklendi (`sifre_sifirlama_tokenlari` tablosu).
- `/api/panel/forgot-password` ve `/api/panel/reset-password` endpointleri eklendi.
- `/panel/sifremi-unuttum` ve `/panel/sifre-sifirla` sayfaları oluşturuldu.
- Kulüp başvuru form bildirimi asenkron mail kuyruğuna bağlandı.
- Local testler için Mailpit entegrasyonu (Docker Compose) eklendi.

### 🆕 Son Tamamlanan (Haberler & Mock Veri Temizliği)

- `haberler` tablosu eklendi ve admin paneli üzerinden Haberler & Duyurular yönetimi sağlandı.
- Landing page (`index.astro`) `NewsBar` componenti, admin'den girilen gerçek veriyi çekecek şekilde bağlandı.
- `BranslarGrid` landing'e tekrar eklendi ve DB'den (`getAllBranches()`) beslenmesi sağlandı.
- `mockData.ts` kullanımı sistemden temizlendi; `basvuru.astro` ve XML sitemap'leri (`cities.xml.ts`, `districts.xml.ts`) tamamen veritabanından çalışacak hale getirildi.

### 🆕 Son Tamamlanan (Canlıya Alma Operasyonu — 2026-04-26)

- Sunucu erişimi doğrulandı: `root@45.155.19.82`.
- Sunucuda Node `v22.22.2`, `git`, `rsync`, Nginx ve systemd çalışma modeli hazırlandı.
- PocketBase binary/systemd modeliyle kuruldu:
  - Service: `spornerede-pocketbase`
  - Data: `/opt/spornerede/pocketbase/pb_data`
  - Public/uploads: `/opt/spornerede/pocketbase/pb_public`
  - Local URL: `http://127.0.0.1:8090`
- Production env oluşturuldu: `/opt/spornerede/.env`.
  - Üretilen canlı admin/token bilgileri sunucuda root-only dosyada tutulur: `/opt/spornerede/production-credentials.txt`.
  - Bu dosya veya içeriği repoya yazılmamalı.
- PocketBase schema canlıda çalıştırıldı (`npm run pb:setup` eşdeğeri).
- İlk canlı release elle yüklendi ve app servisi aktif hale getirildi:
  - App service: `spornerede`
  - Current symlink: `/opt/spornerede/current`
  - Releases: `/opt/spornerede/releases/<timestamp>`
- Smoke check geçti:
  - `/`
  - `/ara`
  - `/basvuru`
  - `/api/health?deep=1`
- `api/health?deep=1` Brevo SMTP ayarları sonrası `ok` döndü.
- Backup altyapısı eklendi:
  - Script: `deploy/server-backup.sh`
  - Service/timer örnekleri: `deploy/spornerede-backup.*`
  - Sunucuda aktif timer: `spornerede-backup.timer`
  - İlk lokal backup alındı: `/opt/spornerede/backups/spornerede-backup-*.tar.gz`
  - Admin panelde `Yedekler` sekmesi eklendi; `pb_data` + `pb_public` içeren manuel `.tar.gz` indirilebilir.
  - Admin indirilebilir backup içine `.env` ve secret dosyaları konmaz.
- Deploy scriptleri düzeltildi:
  - Astro SSR release sadece `dist/` ile çalışmadığı için release içine `package.json`, `package-lock.json` ve production `node_modules` kurulumu eklendi.
  - Runtime secret değerlerinde `process.env` önceliklendirildi; lokal build-time `.env` değerleri canlı şifreleri ezmemeli.
- Search Console sitemap operasyonu tamamlandı:
  - `sitemap-index.xml`, `cities.xml`, `districts.xml`, `news.xml`, `clubs.xml`, `listings.xml` gönderildi.
  - Dinamik sitemap endpoint'lerinde boş veri durumuna fallback URL (`https://spornerede.net/`) eklendi.
  - "urlset içinde url etiketi eksik" hatası çözüldü ve tüm sitemap URL'leri `200` doğrulandı.

### ⚠️ Canlı Operasyonda Kalan Dış Aksiyonlar

- GitHub deploy key eklendi, `/opt/spornerede/repo` clone edildi ve `spornerede-autoupdate.timer` aktif.
- Offsite backup için ilk aşama kararı: admin panelden aylık manuel backup indirilecek ve yerel bilgisayar/harici diskte saklanacak.
  - 50 GB sunucu alanı 1000 kulüp seviyesine kadar yeterli görülüyor.
  - İhtiyaç büyürse ikinci VPS/S3/Backblaze gibi otomatik offsite hedef sonra eklenir.
- Canlı SMTP Brevo ile tamamlandı:
  - `MAIL_FROM=no-reply@spornerede.net`
  - `MAIL_TO=info@spornerede.net`
  - `npm run smoke:check` deep health `ok`
  - Canlı mail queue testinde `processed:1`, `sent:1`, `failed:0`

### 🆕 Son Tamamlanan (Faz 12 — SEO + Reklam Altyapısı — 2026-05-12)

> Detaylı plan: `memory-bank/seo-ads-plan.md`. Tüm Sprint 12.1 → 12.3 ve Sprint 12.4'ün altyapı kısmı bu turda bitirildi.

**Sprint 12.1 — Paket A (SEO Temeli):**
- `robots.txt` sıkılaştırıldı: `/admin`, `/panel`, `/api`, `/basvuru`, `?utm_*`, `?fbclid=`, `?gclid=` engellendi; GPTBot/CCBot/anthropic-ai/Google-Extended `Disallow: /`. Sitemap referansları (sitemap-index + 5 alt sitemap) eklendi.
- `astro.config.mjs`: `trailingSlash: 'never'`, sitemap integration filter + `lastmod/changefreq/priority`.
- Sitemap endpoint'leri yeniden yazıldı (`src/lib/seo/sitemap.ts` helper'ı ile):
  - Boş kombinasyonlar (kulüpsüz şehir/branş) artık sitemap'e girmiyor.
  - `clubs.xml` ve `listings.xml` slug'lı URL üretiyor.
- Özel `404.astro` sayfası eklendi (arama formu, popüler branşlar, gerçek `status: 404`).
- Tüm public detay sayfalarındaki `Astro.redirect('/ara')` kaldırıldı; bunun yerine gerçek 404 dönülüyor (`/kulupler/[id]`, `/ilanlar/[id]`, `/branslar/[brans]`, `/sehirler/.../[brans]`).
- **Slug tabanlı URL'ler:**
  - `src/lib/seo/slug.ts` — `clubSlug`, `listingSlug`, `extractIdFromSlug`, `isPureNumericSlug`.
  - `/kulupler/[id]` ve `/ilanlar/[id]` slug-veya-id'yi kabul ediyor; pure numeric veya yanlış slug → 301 redirect canonical slug URL'ye. PocketBase şeması değişmedi (slug runtime'da üretiliyor, news repo pattern'i).
  - `searchClubs` ve sitemap'lerdeki tüm internal linkler slug'lı.
- **OG Image altyapısı:**
  - `public/og-image.svg` + `scripts/generate-og-image.mjs` (sharp ile PNG'ye rasterize) — `npm run og:generate`. PNG zaten üretildi (~66 KB).
  - `BaseLayout`'a `og:image` fallback (statik `/og-image.png`).
  - Dinamik OG endpoint: `/api/og.png?title=&kicker=&badge=` — kulüp/ilan detay sayfaları otomatik bunu kullanıyor (kulüp galerisi varsa galeri ilk görsel önceliklenir).

**Sprint 12.1 — JSON-LD (Paket A.2 + A.3):**
- `src/lib/seo/jsonld.ts` — `organizationSchema`, `websiteSchema`, `breadcrumbSchema`, `faqPageSchema`, `sportsActivityLocationSchema`, `courseSchema`, `itemListSchema`, `jsonLdScript`.
- `BaseLayout` her sayfaya Organization + WebSite + (varsa) BreadcrumbList JSON-LD enjekte ediyor; sayfa bazlı ek schema için `jsonLd` prop'u eklendi.
- `/kulupler/[id]` → `SportsActivityLocation` + `LocalBusiness` (multi-type), her aktif program için `Course` schema.
- `/ilanlar/[id]` → `Course` schema (provider + offer + courseInstance + locationText + geo).
- `/ara` → `ItemList` (filtre uygulanmışsa `noindex`).
- `/sehirler/.../[brans]` ve `/sehirler/.../[ilce]/[brans]` → `ItemList`; içerik yoksa `noindex`.
- `FAQSection` → `FAQPage` schema (landing page).
- `Breadcrumb.astro` component — görsel breadcrumb + ekran okuyucu friendly.

**Sprint 12.2 — Paket B (Reklam altyapısı):**
- `ConsentBanner.astro` — KVKK uyumlu, Google Consent Mode v2 default-denied state, 3 kategori (zorunlu/analiz/pazarlama), LocalStorage 12 ay, "Tümünü kabul / Reddet / Yönet" akışı.
- `GoogleTagManager.astro` + `GoogleTagManagerNoscript.astro` — env-driven (`PUBLIC_GTM_ID`, `PUBLIC_GA4_ID`); ID set değilse hiçbir şey enjekte edilmiyor. Consent state'i Banner tarafından set ediliyor.
- `TrackingAutoListeners.astro` — sayfa genelinde otomatik:
  - `tel:` → `lead_phone_click`
  - `mailto:` → `lead_email_click`
  - Google Maps linkleri → `lead_maps_click`
  - Başvuru/iletişim form submit → `application_submit` / `contact_form_submit`
  - UTM/gclid/fbclid yakalama → 30 gün `sn_attribution` first-party cookie
- `src/lib/analytics/track.ts` — programlı event API (`events.viewListing`, `events.viewClub`, ...).
- `/api/internal/track` — server-side first-party event log (sendBeacon kabul ediyor; structured stdout JSON).
- 4 yasal sayfa: `/gizlilik-politikasi`, `/cerez-politikasi`, `/kvkk-aydinlatma-metni`, `/kullanim-kosullari`. Footer'a tümü linklendi.
- `AdSlot.astro` — CLS-safe placeholder (leaderboard / rectangle / skyscraper / feed). `PUBLIC_AD_PROVIDER` env aktif edilince görünür.
- `public/ads.txt` — boş placeholder + IAB referansı.
- `.env.example` — `PUBLIC_GTM_ID`, `PUBLIC_GA4_ID`, `INTERNAL_TRACK_TOKEN`, `PUBLIC_AD_PROVIDER` eklendi.

**Sprint 12.3 — Paket C (Performans + İçerik):**
- Outfit fontu self-hosted'a alındı:
  - `scripts/copy-fonts.mjs` (`npm run fonts:copy`) — `@fontsource/outfit` woff2 dosyalarını `public/fonts/outfit/` altına kopyalar. 14 dosya kopyalandı (7 ağırlık × latin + latin-ext).
  - `src/styles/fonts.css` — `@font-face` tanımları, `font-display: swap`, doğru unicode-range.
  - `BaseLayout` Google Fonts `<link>` kaldırıldı; 400 + 700 woff2 dosyaları `<link rel="preload">` ile LCP için öncelikli.
- Network ipuçları: `dns-prefetch` + `preconnect` for `googletagmanager.com` ve `google-analytics.com`.
- Astro prefetch (`hover` strategy) açıldı: viewport içindeki internal link'ler hover'da preload edilir.
- `src/middleware.ts` — global Cache-Control + güvenlik header'ları:
  - Liste/landing sayfalar: `public, max-age=60, s-maxage=300-600, stale-while-revalidate=3600`.
  - Detay sayfalar: `s-maxage=600, swr=3600`.
  - Sitemap: `s-maxage=3600, swr=86400`.
  - `/admin`, `/panel`, `/basvuru`, `/api/` → `private, no-store`.
  - `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` HTML response'lara eklendi.
- Şehir/branş ve şehir/ilçe/branş landing'leri zenginleştirildi:
  - Breadcrumb + hero + CTA + filtreli arama linki + popüler ilçeler chip listesi + kulüp kart listesi (slug URL'leri) + bilgilendirici metin.
  - Boş kombinasyon → `noindex` (sitemap'te zaten yok, ama runtime emniyeti).
- Galeri görsellerine `decoding="async"`, `width/height` ve daha açıklayıcı `alt` text (`{kulüp ad} - {ilan ad} görseli {idx}`) eklendi.

**Sprint 12.4 — Paket D (kısmi):**
- `hreflang` self-referencing eklendi (BaseLayout: `tr-TR` + `x-default`).
- `trailingSlash: 'never'` ile canonical disiplini.
- Monitoring / blog rehberi içerik üretimi bu sprint dışında kaldı (içerik işi, ayrıca planlanacak).

**Build & Test:**
- `npm run build` ✅ temiz tamamlandı (server build 21.4 s).
- ReadLints tüm yeni/değişen dosyalarda 0 hata raporladı.

### 📋 Sıradaki (geliştirme sırası: Faz 13 → 17, sonra / paralel Faz 4)

Özet yol: **Faz 13** ücretli ölçüm ve reklam → **Faz 14** organik SEO (indeks, içerik, programatik kalite, şema) → **Faz 15** trafik kancaları (mini quiz, sezon sayfası, bülten) → **Faz 16** güven ve dağıtım (E-E-A-T, doğrulanmış kulüp taslağı, PR şablonu) → **Faz 17** gelir MVP (öne çıkarma, paket, kredi, ödeme iskeleti) → **Faz 4** harita, tam quiz, yorum ve derin filtre (büyük epik; kaynakla paralel planlanabilir).

Tam `[ ]` checklist: `memory-bank/faz-gelistirme-checklist-tr.md`. Strateji ve taktik detay: `memory-bank/growth-revenue-traffic-tr.md`.

**Faz 13 — Reklam yayını (önkoşul: GA4/GTM production’da stabil):**

- `PUBLIC_GA4_ID` / `PUBLIC_GTM_ID` production; AdSense yolunda içerik birikimi ve `ads.txt`.
- Google Ads / dönüşüm içe aktarma; ilk kampanya seti (`progress.md`).

**Faz 14 — SEO (içerik + indeks):**

- Bing ve Yandex doğrulama + sitemap; Search Console rutini; uzun kuyruk rehberler.
- Programatik landing zenginleştirme; haber/ilandan iç link; HowTo/Event/NewsArticle şema; görsel adlandırma + `alt`.

**Faz 15 — Organik trafik ürünleri:** mini test → `/ara` URL; sezon hub; bülten + lead magnet MVP; UTM ve kanal ölçümü.

**Faz 16 — E-E-A-T ve dağıtım:** Hakkımızda/İletişim; yazar/tarih; doğrulanmış kulüp süreci; ortaklık ve topluluk kılavuzu.

**Faz 17 — Gelir MVP:** sponsor sıralama; kulüp paket kotası; lead/tıklama kredisi; panel özeti; ödeme sağlayıcı iskeleti.

**Faz 4 — Gelişmiş ürün:** harita; tam eşleştirme quiz’i; yorum/puanlama; URL ile derin filtre (Faz 15 mini testinden ayrı).

**Sürekli operasyon (tüm fazlar boyunca):**

- Search Console: dizin, CWV, URL denetimi; canonical/`noindex` disiplini; iç linkleme ve backlink kalite kontrolü (`mvp-metrics.md` ile hizalı).

> Detaylı yol haritası: `memory-bank/seo-ads-plan.md`. Aşağıdaki bölüm operasyonel rutin içindir.

1. **Haftalık teknik kontrol (30 dk):**
   - Sitemap erişim/boş içerik kontrolü
   - 404/500 ve crawl anomaly kontrolü
   - robots/canonical/noindex hızlı tarama
   - PageSpeed Insights API ile Core Web Vitals snapshot (Faz 12 sonrası)
2. **Aylık içerik + keşif kontrolü:**
   - Hangi içerik tipleri daha hızlı index alıyor (haber/ilan/kulüp/rehber)
   - İç linkleme ve başlık/meta iyileştirme adaylarının listelenmesi
   - Search Console click/impression deltası → `mvp-metrics.md`
3. **Operasyonel alarm yaklaşımı:**
   - Deploy sonrası `sitemap-index.xml` + 5 alt sitemap smoke check
   - Her deploy sonrası servis ayakta mı + XML içinde en az bir `<url>` var mı doğrulama
   - (Faz 12 sonrası) GA4 DebugView'da kritik event'lerin (`view_listing`, `application_submit`, `lead_phone_click`) hâlâ akıyor olduğu kontrolü

### Operasyonel yükü düşüren backlog (öneri havuzu)

> Amaç: admin ve kulüp tarafında **tekrarlayan manuel işi**, **destek / düzeltme talebini** ve **sunucu-maliyet baskını** azaltmak. Ana faz yolunu değiştirmez; onay sonrası sprint veya `faz-gelistirme-checklist-tr.md` içine taşınır.

**Kulüp paneli — branş ve profil verisi**

- **Profil doluluk göstergesi:** Branş, adres, galeri, program vb. için yüzde veya checklist; eksik alanlara tek tıkla yönlendirme. Daha tam profiller → daha az “neden çıkmıyorum?” sorusu ve daha iyi SEO sinyali.
- **Branş seçim UX:** Uzun listede arama kutusu; “son seçtiklerin” veya sık kullanılanlar (aynı oturumda bile yeter); alfabetik atlama veya gruplama isteğe bağlı.
- **Tutarlılık uyarıları:** Aynı branşın iki kez eklenmesini engelleme veya uyarı; birbirine çok yakın etiketler (“Futbol” / “Futbol okulu”) için yumuşak uyarı — admin birleştirme politikasıyla birlikte düşünülebilir.
- **Branş ↔ program bağlantısı:** “Bu branşta henüz yayında program yok” panel ipucu; boş arama sonucu ve kızgın kullanıcı e-postası azalır.
- **Hafif toplu düzenleme:** Mevcut branşları tek ekranda sıralama; şema uygunsa geçici “yayında değil” veya taslak — tek tek kart gezme süresini kısaltır.

**Performans ve barındırma maliyeti**

- **Panel yüklemeleri — görsel pipeline:** Yüklenen fotoğraflarda sunucu tarafı yeniden boyutlandırma + WebP/AVIF (mevcut sharp/optimizasyon kültürüyle uyumlu). Depolama, bant genişliği ve LCP için net kazanç; büyük dosya destek talebi azalır.
- **Sıcak sorgular:** `/ara` ve şehir/branş landing’lerinde en çok kullanılan filtreler için kısa TTL önbellek veya PocketBase tarafında index / sorgu ince ayarı — tepe yükte CPU ve yanıt süresi stabil kalır.
- **Liste sayfaları — ilk ekran:** Mobilde daha az kart + sayfalama veya “daha fazla yükle”; scroll jank ve bellek baskısı azalır, düşük cihazlarda şikayet düşer.

**Ürün — dönüşüm ve destek yükü**

- **Kayıtlı arama / yeni eşleşme bildirimi:** Filtreye uygun yeni kulüp veya ilan için e-posta (ileride push). Kullanıcı tekrar siteye dönmeden lead üretimi; “haber var mı?” tipi iletişim azalır.
- **Mini kulüp karşılaştırma:** İki–üç kulübü program, konum, (varsa) fiyat bandı ile yan yana. Karar süresi kısalır, “hangisini seçeyim?” destek yükü hafifler.

**Güvenlik ve operasyon**

- **Başvuru çakışması:** Aynı telefon veya e-posta ile ikinci başvuruda uyarı veya mevcut kayda yönlendirme. Admin’de mükerrer inceleme ve gereksiz provisioning azalır.
- **Panel / login hız sınırı ve basit güvenlik log’u:** Brute force ve bot form spam ayrımı; olayları yapılandırılmış log veya mevcut iç track ile sınırlı tutarak inceleme süresi kısalır.

## Faz Sırasına Göre Uygulama Akışı

1. **Faz 2.1–2.2:** PocketBase ve `/ara` veri sorgusu (Tamamlandı)
2. **Faz 3:** Admin, kulüp paneli, belgeler (Büyük oranda tamamlandı)
3. **Faz 11:** Deploy ve operasyon (Sürekli)
4. **Faz 12:** SEO + reklam altyapısı (Tamamlandı)
5. **Faz 13 → 17:** Reklam ölçümü → organik SEO → trafik ürünleri → E-E-A-T → gelir MVP — sıra ve `[ ]` maddeler: `faz-gelistirme-checklist-tr.md`
6. **Faz 4:** Harita, tam quiz, yorum, derin filtre (büyük epik; 13–17 ile paralel veya sonrası)
7. **Operasyonel takip:** `mvp-metrics.md` haftalık/aylık izleme

## Son Kararlar


| Karar                                   | Tercih | Neden                                                                       |
| --------------------------------------- | ------ | --------------------------------------------------------------------------- |
| Landing (tanıtım) + Arama AYRI sayfalar | ✅      | Landing keşfettirici/tanıtım, `/ara` sayfası arama odaklı                   |
| Arama sayfası düzeni                    | ✅      | **Üstte:** branş filtresi (sticky), **Solda:** il/ilce, **Sağda:** sonuçlar |
| E-posta servisi                         | ✅      | **Self-hosted** — Nodemailer + kendi SMTP sunucusu                          |
| Kulüp temsilcisi girişi                 | ✅      | Route kökü `/panel/`*; ilk adım `/panel/giris`                              |
| Yönetim paneli kökü                     | ✅      | `/admin` (liste+detay UI sıradaki sprint)                                   |
| Header menü sadeleştirme                | ✅      | Marka anlatımı için `Haberler/Hakkımızda/İletişim`                          |
| Kırmızı-Beyaz palet                     | ✅      | Türk kimliği, güçlü marka                                                   |
| Astro.js SSG/SSR                        | ✅      | SEO + hız                                                                   |
| TailwindCSS v4                          | ✅      | Zaten kurulu                                                                |


## Aktif Düşünceler ve Notlar

### Sayfa Mimarisi (2 Ayrı Deneyim)

**Landing Page (`/`)** → Keşif ve tanıtım odaklı

- "SPOR NEREDE?" hero vurgusu
- Kompakt arama çubuğu (yazı tabanlı autocomplete + submit → `/ara?...`)
- Haber/duyuru bandı
- Sıkça Sorulan Sorular
- Kulüp başvurusu CTA bölümü
- Footer

**Arama Sayfası (`/ara`)** → Arama ve sonuç odaklı

- **Üst şerit:** Branş filtresi (sticky, her zaman görünür) + seçili il/ilceyi koruyan gizli alanlar
- **Sol sütun:** Il ve ilce secimi + uygula
- **Sağda:** Kulüp/kurs kartlarından olusan sonuc grid'i
- Filtreler: Il/Ilce, Brans (ileride: fiyat, gun, deneme dersi)
- Sonuc karşısında toplam sayi: "Secilen bolgede X kulup/kurs bulundu"

### Header Tasarımı

- Logo'da "spor nerede?" ifadesi dikkat çekici görünmeli
- "Kulübünü Ekle" butonu header'da en sağda, CTA olarak kırmızı/beyaz kontrast
- Mobilde hamburger menü → akordeon veya full-screen overlay
- Sticky header (scroll'da arka plan efektiyle)

### Haber Bandı

- Sol sütun veya ana contentle yan yana (landing'de)
- Gerçek zamanlı değil başlangıçta; statik veri, ileride CMS

### Başvuru Formu

- Ayrı sayfa (`/basvuru`) + header'da link
- Kulüp adı, branş(lar), ilçe, telefon, e-posta, kısa açıklama
- Submit → Nodemailer (self-hosted SMTP) ile kurucu e-postasına bildirim

## Bir Sonraki Konuşmada Yapılacaklar

1. **Faz 13 — Reklam yayını ve ölçüm** (`progress.md`, `faz-gelistirme-checklist-tr.md`):
   - Production’da `PUBLIC_GTM_ID` / `PUBLIC_GA4_ID` netleştir; GA4 DebugView ile temel event’leri doğrula (`view_listing`, `view_club`, formlar, lead tıkları).
   - Google Ads hesabı + GA4 dönüşüm içe aktarma; ilk kampanya taslağı (şehir+branş arama → landing, PMax veya Search → `/basvuru`, remarketing kitleleri).
   - AdSense için içerik hacmi / `ads.txt` / `PUBLIC_AD_PROVIDER` hazırlığını checklist ile hizala (içerik yeterliyse başvuru).
2. **Faz 12 kapanış doğrulamaları (canlı):** Rich Results / PageSpeed hedefleri, KVKK reddinde analitik tetiklenmemesi — `progress.md` kabul kriterleri.
3. **İsteğe bağlı polish:** Hero klavye typeahead, CTA medya geçişi.
4. **Faz 4** harita ve derin ürün epik — kaynak planına göre 13–17 ile paralel veya sonrası; teknik seçim notu (Leaflet vs Mapbox) ayrı sprintte.