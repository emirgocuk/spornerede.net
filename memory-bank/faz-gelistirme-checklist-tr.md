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

- Sunucu pull + systemd timer tabanli otomatik deploy modeli eklendi
- `release:gate` ve `smoke:check` akışı eklendi
- Deep health endpoint (`/api/health?deep=1`) eklendi
- Rollback script akışı hazır
- Kurulum checklist dokümanı eklendi (`kurulum-checklist-tr.md`)
- Staging ortamı (ayrı) netleştir
- Backup restore tatbikatını düzenli plana bağla

## Faz 12 — SEO + Reklam Altyapısı ✅

- [x] Teknik SEO temeli (robots, sitemap, slug, JSON-LD, middleware cache, self-hosted font, consent, GTM/GA hazırlığı) — ayrıntı: `seo-ads-plan.md`, `activeContext.md`
- [x] Performans ve Lighthouse geri bildirim turu (üretimde doğrulama operasyonu devam eder)

## Faz 13 — Reklam Yayını ve Ölçüm (Ücretli Trafik)

- [ ] Production `PUBLIC_GA4_ID` / `PUBLIC_GTM_ID` netleştirme + DebugView doğrulama
- [ ] Google Ads / dönüşüm içe aktarma (Faz 13 ürün planı: `progress.md`, `growth-revenue-traffic-tr.md` §1 ile uyumlu kampanya hedefleri)
- [ ] AdSense önkoşulları: içerik hacmi, `ads.txt` satırları, `PUBLIC_AD_PROVIDER=adsense`
- [ ] İlk kampanya seti (şehir+branş landing, `/basvuru`, remarketing) canlı + haftalık rapor

## Faz 14 — SEO: İndeks, İçerik, Programatik Sayfalar

> **CTR + organik sıra (bütçesiz çerçeve):** `memory-bank/seo-ctr-organic-plan-tr.md` — GSC “yüksek gösterim / düşük CTR” analizi, programatik title/description şablonları, FAQ/JSON-LD disiplini, görsel SEO, ölçüm; LLM sonraya bırakılabilir.

- [ ] Bing Webmaster Tools doğrulama + sitemap gönderimi
- [ ] Yandex Webmaster doğrulama + sitemap gönderimi
- [ ] Search Console haftalık rutin şablonu (`mvp-metrics.md` veya operasyon notu ile hizalı)
- [ ] Uzun kuyruk rehber mimarisi (blog veya statik rehber koleksiyonu) + ilk içerik seti (≥3 yazı)
- [ ] Şehir / ilçe / branş landing: thin content riskine karşı benzersiz giriş + SSS + iç link (şablon/kurallar + kod)
- [ ] Haber ve ilan detaylarından şehir–branş / kulüp hub’larına iç linkleme (otomatik blok veya yayın checklist’i)
- [ ] JSON-LD genişletmesi: `NewsArticle` (haber), `HowTo` / `FAQPage` (rehber), `Event` (kamp/etkinlik sayfası varsa)
- [ ] Görsel arama disiplini: yüklemelerde anlamlı dosya adı veya sunucu tarafı isimlendirme + `alt` kuralları (panel uyarısı opsiyonel)

## Faz 15 — Organik Trafik Ürünleri (Site İçi Kanca)

- [ ] Mini “branş / uygunluk” testi → sonuçta paylaşılabilir `/ara?...` URL (MVP)
- [ ] Sezonluk hub sayfası (“kayıt dönemi / bu ay”) + güncelleme sahibi ve süreç notu
- [ ] Bülten kayıt alanı (landing veya global) + lead magnet (ör. checklist PDF) + gönderim MVP (harici servis veya mevcut mail altyapısı)
- [ ] Kampanya UTM şablonları + GA4’te kanal / kampanya raporlaması (`mvp-metrics.md` tanımlarıyla)

## Faz 16 — E-E-A-T, Güven, Dağıtım Operasyonu

- [ ] Hakkımızda / İletişim: operatör kimliği, iletişim kanalları, güven sinyali (metin + düzen)
- [ ] Rehber ve haber: yazar, yayın tarihi, güncelleme tarihi görünürlüğü
- [ ] Doğrulanmış kulüp programı taslağı (kriterler, admin akışı, rozet) — uygulama faturalandırması Faz 17 ile bağlanabilir
- [ ] İş ortaklığı / basın tek sayfa veya PDF şablonu (yerel PR süreci)
- [ ] Topluluk / QR / kısa video için iç kullanım kılavuzu (spam yok, kalite ve sıklık sınırı)

## Faz 17 — Gelir Modeli MVP (B2B + Hafif B2C)

- [ ] Öne çıkan / sponsor sıralama: veri modeli + `/ara` veya liste görünümü + ölçüm (mevcut event’lerle)
- [ ] Kulüp paket kotası (program / galeri limiti) + özellik bayrakları
- [ ] Lead veya tıklama kredisi: sayaç, rapor, faturalandırma öncesi MVP (ödeme entegrasyonundan önce veya ile birlikte)
- [ ] Kulüp panelinde trafik / lead özeti (ücretsiz MVP veya ücretli modül ayrımı)
- [ ] Ödeme sağlayıcı iskeleti (Iyzico veya Stripe) — paket veya kredi satın alma
- [ ] B2C (opsiyonel bu faz içinde): kayıtlı arama + e-posta uyarı; mini kulüp karşılaştırma (2–3 kulüp)

## Faz 4 — Gelişmiş Ürün (Harita, Tam Quiz, Yorum) — Büyük Epik

> Faz numarası tarihsel; **uygulama sırası** aşağıdaki önerilen blokta yer alır. Harita / tam akıllı eşleştirme / yorum sistemi yüksek efor.

- [ ] Harita (Leaflet veya Mapbox) + liste senkronu
- [ ] Gelişmiş filtreler (gün, seviye, fiyat bandı vb.) + URL senkronu
- [ ] Tam kapsamlı eşleştirme quiz’i (Faz 15’teki mini testten ayrı, skor ve açıklama derinliği)
- [ ] Yorum / puanlama (moderasyon + KVKK)

### Önerilen geliştirme sırası (faz numarası akışı)

1. **Faz 13** — Ölçüm ve ücretli trafik (GA/GTM/Ads/AdSense yol haritası)  
2. **Faz 14** — Organik SEO (indeks + içerik + programatik kalite + şema)  
3. **Faz 15** — Trafik kancaları (quiz MVP, sezon sayfası, bülten)  
4. **Faz 16** — Güven ve dış dağıtım (E-E-A-T, doğrulama taslağı, PR şablonu)  
5. **Faz 17** — Gelir MVP (öne çıkarma, paket, kredi, ödeme)  
6. **Faz 4** — Harita ve derin ürün (kaynak planına göre 14–17 ile paralel veya 17 sonrası yoğun sprint)

Detaylı gelir ve trafik taktik listesi: `growth-revenue-traffic-tr.md`. Operasyonel yük azaltma maddeleri: `activeContext.md` (Operasyonel yükü düşüren backlog).

## Demo & Pazarlama Hazırlığı

- Demo seed scripti eklendi (`npm run demo:seed`)
- Demo checklist dokümanı eklendi (`demo-ready-checklist-tr.md`)
- Go-live guardrails dokümanı eklendi (`go-live-guardrails.md`)
- Demo sonrası geri bildirim toplama formatını standartlaştır
- İlk dış test grubu için onboarding scriptini otomasyona bağla

## Bu Haftaki Odak (Önerilen)

- `faz-gelistirme-checklist-tr.md` üzerinden **Faz 13** ilk `[ ]` maddeleri (GA/GTM production, reklam ölçümü)
- Faz 14 için Bing/Yandex doğrulama ve Search Console rutin şablonu taslağı

## Backlog — Operasyonel yük azaltma (öneri havuzu)

Odağı: admin ve kulüp tarafında tekrarlayan iş, destek / düzeltme talebi ve sunucu baskısını azaltmak. Ayrıntılı madde ve gerekçeler: `activeContext.md` içindeki **Operasyonel yükü düşüren backlog (öneri havuzu)**.

- Kulüp paneli: profil doluluk göstergesi; branş seçiminde arama ve sık kullanılanlar; çift / yakın isim uyarıları; branş–program boşluğu ipucu; branş sıralama veya hafif toplu düzenleme (şema uygunluğuyla).
- Performans: panel yüklemelerinde görsel yeniden encode (WebP/AVIF); sık arama ve landing sorgularında kısa TTL önbellek veya index tuning; mobil listede ilk ekran + sayfalama veya “daha fazla yükle”.
- Ürün: kayıtlı arama / yeni eşleşme bildirimi; mini kulüp karşılaştırma (2–3 kulüp).
- Güvenlik / operasyon: başvuru çakışması (telefon/e-posta) uyarısı; panel ve login için rate limit + basit güvenlik log’u.

Gelir modeli ve SEO/trafik büyüme fikirleri (ayrı doküman): `growth-revenue-traffic-tr.md`.