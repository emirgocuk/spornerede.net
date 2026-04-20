# SporNerede.net — Faz Bazlı Geliştirme Checklist (TR)

Bu dosya, proje ilerlemesini tek yerden takip etmek için faz bazlı ana checklist'tir.

## Faz 1 — Landing & Temel Ürün

- Landing sayfası (`/`) temel blokları tamamlandı
- Header/Footer/Hero/FAQ/CTA bileşenleri entegre edildi
- `/basvuru` formu + temel submit akışı eklendi
- SEO temel katman (`robots`, sitemap, meta) eklendi
- Mobil responsive görünüm tamamlandı

## Faz 2 — Arama & Listeleme

- `/ara` filtreleme iskeleti tamamlandı
- Branş ve kulüp detay sayfaları eklendi
- Public arama kartlarında program özeti gösterimi eklendi
- Kulüp detay sayfasında aktif program listesi gösterimi eklendi
- [x] Mock veri bağımlılığını tamamen kaldır (core repo ve API akışları DB zorunlu)
- Arama sorgu performans optimizasyonları (index + query tuning)

## Faz 3A — Auth, Başvuru, Admin Temel

- Auth tabloları eklendi (`kullanicilar`, `oturumlar`, `kulup_uyelik_kullanicilari`)
- Başvuru belge tablosu eklendi (`basvuru_belgeleri`)
- Auth repository ve session akışı eklendi
- Panel login/logout/session endpointleri eklendi
- Admin başvuru liste + detay + durum güncelleme akışı eklendi
- Admin belge metaverisi endpointleri eklendi
- Admin onboarding endpointi eklendi (`/api/admin/provision-club-user`)
- Onboarding sonrası bilgilendirme maili eklendi
- İlk girişte zorunlu şifre değiştirme akışı eklendi

## Faz 3B — Kulüp Paneli

- `/panel` korumalı alan eklendi
- `/panel/profil` profil yönetimi eklendi
- `/panel/kurslar` kurs/program CRUD eklendi
- Header auth UX: oturum açıkken "Panelim" davranışı eklendi
- [x] Panel yetki scope edge-case sertleştirme (onaylı kulüp üyeliği + rol guard)
- Panelde şifre değiştirme sonrası güvenli yönlendirme/hata UX iyileştirme

## Faz 3C — Admin Shell Derinleştirme

- Admin listede arama + durum filtreleri eklendi
- Admin notu (kalıcı) eklendi
- Admin onboarding UI eklendi (hesap oluştur/güncelle)
- [x] Admin not geçmişi (timeline) eklendi
- [x] Admin assignment (başvuru sorumlusu) eklendi
- Belge indirme modeli eklendi (`/api/admin/application-document-download`)
- Presigned URL modeline geçiş (opsiyonel, object storage planında)

## Faz 11 — Deploy & Operasyon

- CI deploy workflow eklendi (`.github/workflows/deploy.yml`)
- `release:gate` ve `smoke:check` akışı eklendi
- Deep health endpoint (`/api/health?deep=1`) eklendi
- Rollback script akışı hazır
- Kurulum checklist dokümanı eklendi (`kurulum-checklist-tr.md`)
- Staging ortamı (ayrı) netleştir
- Backup restore tatbikatını düzenli plana bağla

## Demo & Pazarlama Hazırlığı

- Demo seed scripti eklendi (`npm run demo:seed`)
- Demo checklist dokümanı eklendi (`demo-ready-checklist-tr.md`)
- Go-live guardrails dokümanı eklendi (`go-live-guardrails.md`)
- Demo sonrası geri bildirim toplama formatını standartlaştır
- İlk dış test grubu için onboarding scriptini otomasyona bağla

## Bu Haftaki Odak (Önerilen)

- Mock veriyi tamamen kaldır (Faz 2 kapanışı)
- Admin belge akışını dosya indirme modeliyle tamamla
- Panel edge-case yetki kontrollerini sertleştir
- İlk dış test run'ını checklist ile başlat