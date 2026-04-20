# SporNerede.net — İlerleme Durumu (Progress)

## Özet Durum

**Faz: Veri + kulüp paneli / yönetim (planlama ve ilk UI yolları başladı)**
**Versiyon:** 0.3.0

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

- PostgreSQL veritabanı kurulumu
- Drizzle ORM şeması (Kulüp, Branş, İlçe tabloları)
- API endpoint'lerinin gerçek veriye bağlanması
- Mock verinin tamamen kaldırılması
- Kullanıcı oturumu: `users`, `sessions`, `club_memberships` (bkz. `club-auth-admin-plan.md`, `db-schema-plan.md`)
- Başvuru ekleri: `application_documents`, multipart yükleme, güvenli depolama
- Admin arayüzü: başvuru sağ liste + detay + onay/red + onayda kulüp oluşturma (`/admin` genişletmesi)
- Kulüp paneli: oturum sonrası header avatar + dropdown; mobilde hamburger içi accordion

### Ürün Özellikleri

- Gelişmiş filtreleme mantığı (program, seviye, gün)
- Harita entegrasyonu (iframe → interaktif)
- Yorum/puanlama sistemi
- Akıllı eşleştirme quiz'i

### Monetizasyon

- Ücretli üyelik paketleri
- Premium öne çıkarma akışı
- Lead komisyon akışı

---

## 🐛 Bilinen Sorunlar


| Sorun                                      | Durum            | Çözüm                                 |
| ------------------------------------------ | ---------------- | ------------------------------------- |
| Veri katmanı hâlâ mock veri kullanıyor     | 🚧               | Faz 3'te PostgreSQL + Drizzle geçişi  |
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

### Faz 2 — Arama ve Listeleme 🚧

- Arama sonuçları sayfası (Mock veri ile)
- Branş sayfaları (`/branslar` ve `/branslar/[brans]`)
- SEO meta data (Branş bazlı dinamik title)
- Kulüp detay şablonu (`/kulupler/[id]`)
- Gelişmiş filtreleme mantığı (JS taraflı)

### Faz 3 — Veri Tabanı ve Dinamik İçerik (Sıradaki)

- PostgreSQL kurulumu
- Drizzle ORM şeması (Kulüp, Branş, İlçe tabloları)
- Baslangic migration dosyalari olusturuldu (`drizzle/0000_`*, `drizzle/0001_`*)
- Seed altyapisi eklendi (`npm run db:seed`)
- Canlıya alma hazırlığı: release gate + post-deploy smoke test + deep health endpoint
- Faz 3A temel şema eklendi: `kullanicilar`, `oturumlar`, `kulup_uyelik_kullanicilari`, `basvuru_belgeleri`
- Faz 3A migration eklendi: `drizzle/0002_faithful_hammer.sql`
- Faz 3A repository iskeleti eklendi: `src/lib/repositories/auth.ts`, `src/lib/repositories/applicationDocuments.ts`
- Faz 3A API eklendi: `/api/panel/login`, `/api/panel/logout`, `/api/panel/session`
- Panel login sayfasi aktiflestirildi: `/panel/giris` form + `/panel` korumali alan
- Admin API genisletildi: `/api/admin/applications?id=...` detay + `/api/admin/application-documents`
- Basvuru endpointi guclendirildi: dosya kabul/yerel saklama + belge metaverisi kaydi
- Operasyon scripti eklendi: `npm run user:create -- <email> <password> [admin|club]`
- Admin shell UI aktiflestirildi: liste + detay + durum guncelleme + belge metaverisi ekleme (`/admin`)
- Admin shell UI genisletildi: liste arama + durum filtresi + kalici admin notu
- `kulupler.admin_notu` kolonu eklendi (migration: `drizzle/0003_sturdy_signal.sql`)
- Panel profil yonetimi eklendi: `GET/POST /api/panel/profile` + `/panel/profil`
- Header auth UX iyilestirildi: oturum acikken "Uye girisi" -> "Panelim"
- Operasyon scripti eklendi: `npm run user:assign-club -- <email> <club-slug> [owner|staff]`
- Panel kurs/program CRUD eklendi:
  - Tablo: `kulup_programlari` (migration: `drizzle/0004_bright_morning.sql`)
  - API: `GET/POST/PUT/DELETE /api/panel/programs`
  - UI: `/panel/kurslar`
- Public arama entegrasyonu baslatildi:
  - `searchClubs` sonucu kulup bazli aktif program ozeti uretiyor
  - `/ara` kartlarinda program ozeti gosterimi eklendi
- Kulup detay sayfasi programlarla genisletildi:
  - `getClubProgramsByClubId` repository fonksiyonu eklendi
  - `/kulupler/[id]` icinde aktif program listesi gösteriliyor
- Metrics endpoint genisletildi: `clubsWithPrograms`
- Faz 2 kapanis adimi: mock veri fallbacklari core repository akislarindan kaldirildi (DB zorunlu)
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
  - `kullanicilar.sifre_degistirme_zorunlu` kolonu (migration: `drizzle/0005_silent_chamber.sql`)
  - `POST /api/panel/change-password`
  - `GET /panel/sifre-degistir`
  - Geçici şifreyle login sonrası zorunlu yönlendirme
- Demo/launch operasyonlari icin yeni varliklar:
  - Script: `npm run demo:seed`
  - Dokuman: `memory-bank/demo-ready-checklist-tr.md`
  - Dokuman: `memory-bank/go-live-guardrails.md`
  - Dokuman: `memory-bank/kurulum-checklist-tr.md`
- Test ve operasyon dokumanlari eklendi:
  - `memory-bank/test-checklist-tr.md`
  - `memory-bank/server-operations-guide.md`
- API endpoint'lerinin gerçek veriye bağlanması
- Kulüp ekleme/düzenleme admin arayüzü (basit)
- Basvuru + dekont/belge + onay akisi (`club-auth-admin-plan.md` faz 3A–3C) (core tamam, polish devam)
- Kulup paneli sayfalari (profil, kurs/program) ve yetki kapsami (core tamam, polish devam)

### Faz 4 — Gelişmiş Özellikler

- Akıllı eşleştirme quiz'i
- Harita entegrasyonu (Mapbox / Leaflet)
- Yorum/puanlama sistemi
- Premium profil sistemi

---

## 📝 Plan Güncellemesi (Basit Dokuman Seti)

MVP odağını sade tutmak için aşağıdaki bilgilendirme dokumanlari eklendi:

- `memory-bank/db-schema-plan.md`
- `memory-bank/deploy-runbook.md`
- `memory-bank/mvp-metrics.md`
- `memory-bank/security-privacy.md`

Bu set, detayli kurumsal dokumantasyondan ziyade "hemen uygulanabilir adim" odaklidir.