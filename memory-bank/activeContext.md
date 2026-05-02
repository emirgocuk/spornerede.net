# SporNerede.net — Aktif Bağlam (Active Context)

## Şimdiki Çalışma Odağı

**Faz 11: Canlıya alma, self-host operasyon ve sürdürülebilir güncelleme akışı**

Mevcut durum: Landing, `/ara`, `/basvuru`, PocketBase veritabanı altyapısı, admin paneli (başvurular, haberler, kulüpler, iletişim, geribildirimler) ve kulüp paneli (kurs yönetimi, profil) canlı sunucuda çalışacak seviyeye getirildi.
Aktif hedef: Canlı operasyonu tamamlamak; sunucu pull modeli, canlı SMTP ve admin panelden manuel backup indirme doğrulandı. Ürün/teknik çerçeve: `memory-bank/deploy-runbook.md`.

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

- Hero autocomplete davranışını klavye (yukarı/aşağı/enter) ile tamamlamak
- CTA sağ medya geçişini son dokunuşlarla finalize etmek
- **Faz 11: Deploy** — Build testi ve server transferi
- **Faz 2** — Veriyi veritabani katmanina tasima (mock -> PocketBase)
- **Faz 3** — `club-auth-admin-plan.md`: kullanıcılar/oturum, başvuru dosyaları, admin liste+detay+onay, `/panel` giriş ve header oturum UI
- **Faz 4** — Harita ve gelişmiş filtreleme entegrasyonları, akıllı eşleştirme quiz'i.

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

### 📋 Sıradaki (Faz 4 ve İyileştirmeler)

1. **Arama ve Filtreleme:** Arama filtrelerinin URL + veri sorgu katmanını optimize etme, harita entegrasyonu (örn. Mapbox veya Leaflet ile ilanları haritada gösterme).
2. **Monetizasyon (Gelir Modeli):** Ücretli üyelik paketleri, premium ilan öne çıkarma, online ödeme/tahsilat akışları (örn. Iyzico/Stripe entegrasyonu).
3. **Akıllı Eşleştirme:** Kullanıcıların beklentilerine göre kurs/kulüp eşleştirme testi (Quiz akışı).
4. **UX İyileştirmeleri:** Puanlama ve yorum sistemleri.
5. **Teknik SEO Operasyonu (Search Console + keşif):**
   - Haftalık: Search Console "Dizin > Sayfalar", "Core Web Vitals", manuel işlem/güvenlik kontrolleri.
   - Yeni güçlü sayfalar için URL Denetimi ile manuel index talebi (özellikle haber ve ilan detayları).
   - Canonical disiplinini güçlendirme (parametreli/filtreli URL'lerde tek canonical).
   - `noindex` kapsamının net tutulması (`/admin`, `/panel`, şifre sıfırlama, iç operasyon sayfaları).
   - İç linkleme planı: landing + şehir/branş sayfalarından yeni ilan/haber sayfalarına düzenli linkleme.
   - Yapısal veri genişletme: mevcut `NewsArticle` şemasına ek olarak `Organization` ve `BreadcrumbList` tamamlama.
   - Aylık backlink kalite kontrolü (toxicity/spam kaynak izleme, gerekirse disavow değerlendirmesi).

### 📈 SEO İzleme Planı (Yeni)

1. **Haftalık teknik kontrol (30 dk):**
   - Sitemap erişim/boş içerik kontrolü
   - 404/500 ve crawl anomaly kontrolü
   - robots/canonical/noindex hızlı tarama
2. **Aylık içerik + keşif kontrolü:**
   - Hangi içerik tipleri daha hızlı index alıyor (haber/ilan/kulüp)
   - İç linkleme ve başlık/meta iyileştirme adaylarının listelenmesi
3. **Operasyonel alarm yaklaşımı:**
   - Deploy sonrası `sitemap-index.xml` + 5 alt sitemap smoke check
   - Her deploy sonrası servis ayakta mı + XML içinde en az bir `<url>` var mı doğrulama

## Faz Sırasına Göre Uygulama Akışı

1. **Faz 2.1 (ilk adım):** PocketBase geçişi, şema/migration kurulumları (Tamamlandı)
2. **Faz 2.2:** `/ara` filtrelerinin gerçek veri sorgusuna taşınması (Tamamlandı)
3. **Faz 3:** Admin Paneli, Kulüp Yetki Yönetimi, Belge Yüklemeleri, Geribildirimler (Büyük oranda tamamlandı)
4. **Faz 4:** Harita görünümü, ödeme/üyelik altyapıları, puanlama ve akıllı quiz (Sırada)
5. **Faz 11:** `deploy-runbook.md` ile production deploy + hızlı sağlık kontrolleri
6. **Operasyonel takip:** `mvp-metrics.md` haftalık/aylık izleme

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

1. Gerçek veritabanı entegrasyonu için şema tasarımı
2. Arama filtrelerinin veritabanı sorgusuna taşınması
3. Admin paneli için temel yetkilendirme planı
4. Harita entegrasyonu için kütüphane seçimi (Leaflet vs Mapbox)