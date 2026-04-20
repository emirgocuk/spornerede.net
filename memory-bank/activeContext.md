# SporNerede.net — Aktif Bağlam (Active Context)

## Şimdiki Çalışma Odağı

**Faz 2–3: Veritabanı işlevselliği + kulüp paneli / yönetim planı**

Mevcut durum: Landing, `/ara`, `/basvuru`, temel DB migration/seed ve `/admin` + `/api/admin/applications` iskeleti var.
Aktif hedef: Mock’tan kalıcı veriye geçiş; başvurulara belge/dekont, onay sonrası kulüp profili; kulüp temsilcisi `/panel/`* ve yönetimde sağ liste + detay akışı. Ürün/teknik çerçeve: `**club-auth-admin-plan.md`**.

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
- **Faz 2** — Veriyi veritabani katmanina tasima (mock -> PostgreSQL)
- **Faz 3** — `club-auth-admin-plan.md`: kullanıcılar/oturum, başvuru dosyaları, admin liste+detay+onay, `/panel` giriş ve header oturum UI

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

### 🆕 Planlama + küçük UI (kulüp girişi yolu)

- `memory-bank/club-auth-admin-plan.md` — kulüp paneli, admin shell, başvuru+belge, faz sırası
- `db-schema-plan.md` — users, sessions, memberships, application_documents ve genişletilmiş başvuru
- Header: CTA’nın solunda **Üye girişi** (`/panel/giris`); mobil menüde ayrı satır
- Placeholder sayfa: `/panel/giris`

### 📋 Sıradaki

1. Faz 3B: panel yetki scope denetimini genisletme (route/edge-case sertlestirme)
2. Faz 3C: admin shell (ek aksiyonlar: not gecmisi, assignment, belge indirme/presigned url)
3. Arama filtrelerinin URL + veri sorgu katmanını optimize etme (performans + index)
4. Kulup liste/veri kaynaklarının API ile birlestirilmesi ve landing bloklarına yansitma

## Basit Plan Güncellemesi (Bilgilendirme)

MVP'yi sade tutmak için aşağıdaki kısa dokumanlar eklendi:

- `memory-bank/db-schema-plan.md`
- `memory-bank/club-auth-admin-plan.md` (panel + admin + başvuru dosyaları)
- `memory-bank/deploy-runbook.md`
- `memory-bank/github-auto-deploy-checklist.md` (English, checkbox-based active deploy guide)
- `memory-bank/server-operations-guide.md` (English, server-side operational baseline)
- `memory-bank/test-checklist-tr.md` (Turkish, evening batch test checklist)
- `memory-bank/demo-ready-checklist-tr.md` (Turkish, demo preparation checklist)
- `memory-bank/kurulum-checklist-tr.md` (Turkish, installation checklist)
- `memory-bank/faz-gelistirme-checklist-tr.md` (Turkish, phase-by-phase master progress checklist)
- `memory-bank/go-live-guardrails.md` (English, release safety guardrails)
- `memory-bank/mvp-metrics.md`
- `memory-bank/security-privacy.md`

Bu dokumanlar "detaydan çok uygulama netligi" hedefiyle kısa tutuldu.

## Faz Sırasına Göre Uygulama Akışı

1. **Faz 2.1 (ilk adım):** `db-schema-plan.md` temelinde Drizzle + PostgreSQL şema/migration
2. **Faz 2.2:** `/ara` filtrelerinin gerçek veri sorgusuna taşınması
3. **Faz 2.3:** Mock verinin kaldırılması ve seed/gerçek veri doğrulaması
4. **Faz 11:** `deploy-runbook.md` ile production deploy + hızlı sağlık kontrolleri
5. **Operasyonel takip:** `mvp-metrics.md` haftalık/aylık izleme
6. **Temel koruma:** `security-privacy.md` checklist maddelerinin uygulanması

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