# SporNerede.net — Aktif Bağlam (Active Context)

## Şimdiki Çalışma Odağı
**Faz 2–3: Veritabanı işlevselliği + kulüp paneli / yönetim planı**

Mevcut durum: Landing, `/ara`, `/basvuru`, temel DB migration/seed ve `/admin` + `/api/admin/applications` iskeleti var.
Aktif hedef: Mock’tan kalıcı veriye geçiş; başvurulara belge/dekont, onay sonrası kulüp profili; kulüp temsilcisi `/panel/*` ve yönetimde sağ liste + detay akışı. Ürün/teknik çerçeve: **`club-auth-admin-plan.md`**.

## Güncel Görevler (Öncelik Sırasıyla)

### ✅ Tamamlanan
- [x] Astro.js + TailwindCSS 4 kurulumu
- [x] Sunucu altyapısı (Nginx + Cloudflare + SSL)
- [x] Memory Bank dosyaları oluşturuldu
- [x] `global.css` — Tam tema token sistemi ve animasyonlar
- [x] `BaseLayout.astro` — SEO ve Meta altyapısı
- [x] Bileşenler: `Header`, `Hero`, `NewsBar`, `BranslarGrid`, `ClubCTA`, `Footer`
- [x] Sayfalar: `index.astro` (Landing), `ara.astro` (Arama), `basvuru.astro` (Form)
- [x] API: `/api/basvuru` (Nodemailer entegrasyonu)
- [x] SEO: `robots.txt`, `sitemap` ve meta taglar
- [x] Mobil responsiveness ve micro-animations

### 🚧 Devam Eden
- [ ] Hero autocomplete davranışını klavye (yukarı/aşağı/enter) ile tamamlamak
- [ ] CTA sağ medya geçişini son dokunuşlarla finalize etmek
- [ ] **Faz 11: Deploy** — Build testi ve server transferi
- [ ] **Faz 2** — Veriyi veritabani katmanina tasima (mock -> PostgreSQL)
- [ ] **Faz 3** — `club-auth-admin-plan.md`: kullanıcılar/oturum, başvuru dosyaları, admin liste+detay+onay, `/panel` giriş ve header oturum UI

### 🆕 Son Tamamlanan (UI Revizyon Paketi)
- [x] Header navigasyon sadeleştirildi (`Haberler`, `Hakkımızda`, `İletişim`)
- [x] Türkiye geneli metin dili uygulandı (Ankara odaklı metinler temizlendi)
- [x] Hero badge şehir rotator tasarımı güncellendi (14ch kutu, center align)
- [x] Hero arama alanı yazı tabanlı öneri paneline geçirildi (ilk 3 tahmin)
- [x] Native `datalist` dropdown iptal edildi, custom suggestion panel aktif
- [x] Landing'e `Sıkça Sorulan Sorular` bölümü eklendi
- [x] Club CTA sağ medya alanı eklendi, arka planla geçişli bütünlük sağlandı
- [x] Footer logo yeni marka stiline güncellendi

### 🆕 Son Tamamlanan (Faz 2.1)
- [x] Drizzle config komutlari guncellendi (`db:generate`, `db:migrate`)
- [x] Ilk migration seti uretildi (`drizzle/0000_*`, `drizzle/0001_*`)
- [x] `kulupler` tablosu icin temel index ve unique slug tanimlari eklendi
- [x] `db:seed` komutu eklendi (`scripts/db-seed.ts`)
- [x] DB client ortam degiskeni erisimi Astro + Node script uyumlu hale getirildi

### 🆕 Planlama + küçük UI (kulüp girişi yolu)
- [x] `memory-bank/club-auth-admin-plan.md` — kulüp paneli, admin shell, başvuru+belge, faz sırası
- [x] `db-schema-plan.md` — users, sessions, memberships, application_documents ve genişletilmiş başvuru
- [x] Header: CTA’nın solunda **Üye girişi** (`/panel/giris`); mobil menüde ayrı satır
- [x] Placeholder sayfa: `/panel/giris`

### 📋 Sıradaki
1. Veritabanı şeması tasarımı (PostgreSQL + Drizzle)
2. Arama filtrelerinin URL + veri sorgu katmanına taşınması
3. Kulup liste/veri kaynaklarının API ile birlestirilmesi
4. Deploy paketi ve sunucuya transfer

## Basit Plan Güncellemesi (Bilgilendirme)
MVP'yi sade tutmak için aşağıdaki kısa dokumanlar eklendi:
- `memory-bank/db-schema-plan.md`
- `memory-bank/club-auth-admin-plan.md` (panel + admin + başvuru dosyaları)
- `memory-bank/deploy-runbook.md`
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

| Karar | Tercih | Neden |
|---|---|---|
| Landing (tanıtım) + Arama AYRI sayfalar | ✅ | Landing keşfettirici/tanıtım, `/ara` sayfası arama odaklı |
| Arama sayfası düzeni | ✅ | **Üstte:** branş filtresi (sticky), **Solda:** il/ilce, **Sağda:** sonuçlar |
| E-posta servisi | ✅ | **Self-hosted** — Nodemailer + kendi SMTP sunucusu |
| Kulüp temsilcisi girişi | ✅ | Route kökü `/panel/*`; ilk adım `/panel/giris` |
| Yönetim paneli kökü | ✅ | `/admin` (liste+detay UI sıradaki sprint) |
| Header menü sadeleştirme | ✅ | Marka anlatımı için `Haberler/Hakkımızda/İletişim` |
| Kırmızı-Beyaz palet | ✅ | Türk kimliği, güçlü marka |
| Astro.js SSG/SSR | ✅ | SEO + hız |
| TailwindCSS v4 | ✅ | Zaten kurulu |

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
