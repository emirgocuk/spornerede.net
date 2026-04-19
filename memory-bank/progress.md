# SporNerede.net — İlerleme Durumu (Progress)

## Özet Durum
**Faz: Veri + kulüp paneli / yönetim (planlama ve ilk UI yolları başladı)**
**Versiyon:** 0.3.0

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
- [ ] PostgreSQL veritabanı kurulumu
- [ ] Drizzle ORM şeması (Kulüp, Branş, İlçe tabloları)
- [ ] API endpoint'lerinin gerçek veriye bağlanması
- [ ] Mock verinin tamamen kaldırılması
- [ ] Kullanıcı oturumu: `users`, `sessions`, `club_memberships` (bkz. `club-auth-admin-plan.md`, `db-schema-plan.md`)
- [ ] Başvuru ekleri: `application_documents`, multipart yükleme, güvenli depolama
- [ ] Admin arayüzü: başvuru sağ liste + detay + onay/red + onayda kulüp oluşturma (`/admin` genişletmesi)
- [ ] Kulüp paneli: oturum sonrası header avatar + dropdown; mobilde hamburger içi accordion

### Ürün Özellikleri
- [ ] Gelişmiş filtreleme mantığı (program, seviye, gün)
- [ ] Harita entegrasyonu (iframe → interaktif)
- [ ] Yorum/puanlama sistemi
- [ ] Akıllı eşleştirme quiz'i

### Monetizasyon
- [ ] Ücretli üyelik paketleri
- [ ] Premium öne çıkarma akışı
- [ ] Lead komisyon akışı

---

## 🐛 Bilinen Sorunlar

| Sorun | Durum | Çözüm |
|---|---|---|
| Veri katmanı hâlâ mock veri kullanıyor | 🚧 | Faz 3'te PostgreSQL + Drizzle geçişi |
| Nginx yönlendirme sorunlarının geçmişi var | ✅ Çözüldü | Cloudflare SSL modu düzenlendi |
| Astro image sharp pixel limiti | ✅ Geçici çözüldü | CTA görselleri `img` olarak sunuluyor |

---

## 📊 Yol Haritası

### Faz 1 — Landing Page & Temel Özellikler ✅
- [x] Component mimarisi kur
- [x] Header + navigasyon (Sticky & Dropdown)
- [x] Hero + arama alanı
- [x] Haber/duyuru bandı
- [x] Branşları keşfet bölümü (landingden kaldırıldı, component mevcut)
- [x] Footer (4 Sütunlu)
- [x] Kulüp başvuru sayfası & API
- [x] SEO (Robots.txt, Sitemap, Meta tags)
- [x] Sıkça Sorulan Sorular bölümü
- [x] Türkiye geneli metin/marka dili revizyonu

### Faz 2 — Arama ve Listeleme 🚧
- [x] Arama sonuçları sayfası (Mock veri ile)
- [x] Branş sayfaları (`/branslar` ve `/branslar/[brans]`)
- [x] SEO meta data (Branş bazlı dinamik title)
- [x] Kulüp detay şablonu (`/kulupler/[id]`)
- [ ] Gelişmiş filtreleme mantığı (JS taraflı)

### Faz 3 — Veri Tabanı ve Dinamik İçerik (Sıradaki)
- [ ] PostgreSQL kurulumu
- [x] Drizzle ORM şeması (Kulüp, Branş, İlçe tabloları)
- [x] Baslangic migration dosyalari olusturuldu (`drizzle/0000_*`, `drizzle/0001_*`)
- [x] Seed altyapisi eklendi (`npm run db:seed`)
- [ ] API endpoint'lerinin gerçek veriye bağlanması
- [ ] Kulüp ekleme/düzenleme admin arayüzü (basit)
- [ ] Basvuru + dekont/belge + onay akisi (`club-auth-admin-plan.md` faz 3A–3C)
- [ ] Kulup paneli sayfalari (profil, kurs/program) ve yetki kapsami

### Faz 4 — Gelişmiş Özellikler
- [ ] Akıllı eşleştirme quiz'i
- [ ] Harita entegrasyonu (Mapbox / Leaflet)
- [ ] Yorum/puanlama sistemi
- [ ] Premium profil sistemi

---

## 📝 Plan Güncellemesi (Basit Dokuman Seti)

MVP odağını sade tutmak için aşağıdaki bilgilendirme dokumanlari eklendi:
- [x] `memory-bank/db-schema-plan.md`
- [x] `memory-bank/deploy-runbook.md`
- [x] `memory-bank/mvp-metrics.md`
- [x] `memory-bank/security-privacy.md`

Bu set, detayli kurumsal dokumantasyondan ziyade "hemen uygulanabilir adim" odaklidir.
