# SporNerede.net — Gelir modelleri + SEO / trafik öneri havuzu

Bu dosya **ürün stratejisi ve büyüme** için fikir bankasıdır; `seo-ads-plan.md` (Faz 12 uygulama planı), `mvp-metrics.md` ve **organik sıra + CTR için operasyonel çerçeve** `seo-ctr-organic-plan-tr.md` (LLM şart değil; GSC, şablon meta, FAQ/şema, görsel SEO) ile birlikte okunmalıdır. Buradaki maddeler onay ve önceliklendirme sonrası sprinte veya `faz-gelistirme-checklist-tr.md` içine taşınır.

## Faz planı ile eşleme

**Geliştirme sırası (özet):** Faz **13** (reklam/ölçüm) → **14** (organik SEO) → **15** (trafik ürünleri) → **16** (E-E-A-T, dağıtım) → **17** (gelir MVP) → **Faz 4** (harita, tam quiz, yorum; büyük epik, paralel veya sonrası). Tam yapılacak listesi: `faz-gelistirme-checklist-tr.md`.

| Bu dokümandaki bölüm | Öncelikli faz |
| --- | --- |
| §1 Gelir modelleri | **Faz 17** (MVP); doğrulanmış kulüp **Faz 16** (süreç) + **Faz 17** (faturalandırma) |
| §2 SEO ve trafik taktikleri | **Faz 14** (indeks, içerik, şema, programatik), **Faz 15** (quiz, sezon, bülten, UTM), **Faz 16** (güven, dağıtım, E-E-A-T) |

---

## 1. Gelir modelleri (fonksiyonel / satılabilir paketler)

Mevcut omurga: kulüp profili, ilan/program, arama, başvuru, lead takibi (telefon/e-posta/harita tıklamaları), panel ve admin.

### Kulübe satılan (B2B)

| Fikir | Kısa açıklama | Ürün uyumu |
| --- | --- | --- |
| **Öne çıkarma / sponsor sıralama** | `/ara`, şehir–branş (ve ileride harita) içinde süre veya gösterim bazlı üst sıra / rozet. | Arama sonuç sırasına “sponsorlu” alan; mevcut event altyapısı ile ölçüm. |
| **Kulüp abonelik paketleri** | Ücretsiz: temel profil + sınırlı program. Ücretli: daha fazla program, galeri kotası, video, öncelikli destek. | Panelde kota ve özellik bayrakları; ödeme sağlayıcı (Iyzico/Stripe) ile. |
| **Lead veya tıklama başına ücret** | Başvuru gönderimi veya `tel:` / `mailto:` / harita tıklaması başına kredi veya paket. | Mevcut analytics + iç track ile faturalandırma temeli. |
| **Kulüp analitik paneli** | Görüntülenme, tıklama, başvuru hunisi; GA4 + birinci taraf event birleşimi. | Ücretli modül; veri zaten toplanabiliyor. |
| **Bildirim kanalı (SMS / WhatsApp)** | Yeni başvuru veya mesajda ücretli SMS veya işletme mesajı. | Mail kuyruğunun yanına kanal eklentisi. |
| **Zincir / çok şubeli** | Çok lokasyon, merkezi yönetim, CSV veya API senkron. | Enterprise fiyat; şema ve yetki genişletmesi. |
| **Doğrulanmış kulüp** | Belge veya süreç sonrası yıllık ücretli rozet; güven ve SEO sinyali. | Admin onayı + görsel rozet + ayrı landing metni. |

### Aile / sporcu (B2C veya freemium)

| Fikir | Kısa açıklama |
| --- | --- |
| **Kayıtlı arama + uyarı** | Filtreye uygun yeni kulüp/ilan için e-posta veya (ileride) push; küçük ücret veya freemium limit. |
| **Karşılaştırma / kısa liste** | 2–3 kulübü yan yana + PDF özet; tek seferlik veya abonelik. |

### Pazar yeri ve üçüncü taraf

| Fikir | Kısa açıklama |
| --- | --- |
| **Deneme dersi / rezervasyon slotu** | Takvimde slot; komisyon veya modül ücreti. |
| **Ekipman / kamp listeleme** | Onaylı markalar; tıklama veya listeleme ücreti. |
| **Antrenör iş ilanı** | Kulüp ilanı; listeleme veya başarı ücreti. |

### Veri ve iş ortaklığı

| Fikir | Kısa açıklama |
| --- | --- |
| **API / veri feed** | Federasyon, belediye, sigorta ortağı; sözleşme + KVKK. |

### Uygulama önceliği (öneri)

Önce net fiyat konuşulabilenler: **öne çıkarma**, **kulüp paketleri**, **lead/tıklama kredisi**, **doğrulanmış rozet**. Rezervasyon, kamp modülü ve B2C uyarı sonraki dalgada.

---

## 2. SEO ve websiteye trafik çekme (taktik havuzu)

Teknik temel (Faz 12): sitemap, robots, JSON-LD, slug URL’ler, performans. Aşağıdakiler **içerik, keşif ve dağıtım** odaklıdır.

### Arama motorları (Türkiye odaklı)

- **Bing Webmaster + Yandex** doğrulama ve sitemap gönderimi (Google dışı trafik ve çeşitlendirme).
- **Search Console rutini:** dizin kapsamı, Core Web Vitals, manuel işlem; yeni güçlü URL’ler için URL Denetimi.
- **Uzun kuyruk içerik:** veli rehberleri (“X yaşında Y branşı nasıl seçilir”), kayıt sezonu (Eylül, yaz okulu) sayfaları; `seo-ads-plan.md` ile uyumlu blog/rehber turu.
- **Programatik sayfaları zenginleştirme:** şehir / ilçe / branş landing’lerinde tekrarlayan thin content riskine karşı **benzersiz** giriş paragrafları, SSS blokları, iç linkler (aynı şablon + farklı metin disiplini).
- **İç linkleme:** haber ve ilan detaylarından ilgili şehir–branş ve kulüp sayfalarına düzenli bağlantı; landing’den yeni içeriğe “editör seçimi” modülü.
- **Yapısal veri genişletmesi:** rehber yazılarda `FAQ` / `HowTo`; etkinlik/kamp varsa `Event`; haberlerde tutarlı `NewsArticle` (yazar, tarih, yayıncı).
- **Görsel arama:** anlamlı dosya adları ve `alt` metinleri (projede iyileştirmeler var; yeni yüklemelerde disiplin).

### Güven ve E-E-A-T

- **Hakkımızda / iletişim** netliği; haber ve rehberde mümkünse yazar ve güncelleme tarihi.
- **Doğrulanmış kulüp** programı hem gelir hem güven sinyali (yukarıdaki B2B maddesi ile birleşir).

### Dağıtım ve “off-site” trafik (etik, sürdürülebilir)

- **Bülten:** landing’de tek alan; “kulüp seçim checklist’i” gibi lead magnet ile kayıt → haftalık özet (yeni ilanlar, haberler).
- **Kısa video:** Instagram / YouTube Shorts’ta tek ipucu + derin link (`/ilanlar/...`, `/sehirler/...`).
- **Yerel iş birlikleri:** okul veli dernekleri, belediye spor birimleri, branş federasyonları; basit iş ortaklığı sayfası veya basın bülteni.
- **Dijital PR:** spor bloglarına veri veya alıntı (grafik: “şehir X’te en çok aranan branşlar”) — backlink hedefi.
- **Topluluk:** Facebook grupları / forumlarda spam yapmadan, soru cevaplarda gerçekten yardımcı yanıt + ilgili sayfa linki (politika: kalite ve sıklık sınırı).
- **Yerel etkinlik:** turnuva / deneme günü afişlerinde QR → şehir veya branş landing URL’si.

### Ürün içi trafik kancaları (SEO ile uyumlu)

- **Ücretsiz mini araç:** “Size uygun branş” kısa testi → sonuçta `/ara` önceden dolu filtre (paylaşılabilir URL).
- **Sezon takvimi:** “Bu ay hangi branşlarda kayıt var” gibi tek sayfa; güncellenince tekrar tarama nedeni.

### Ölçüm

- Trafik kanalı bazında hedefler ve haftalık kontrol: `mvp-metrics.md` ile hizala; GA4 + Search Console birlikte yorumlanır.

---

## 3. İlgili diğer memory-bank dosyaları

- `seo-ads-plan.md` — Faz 12 uygulanan SEO + reklam altyapısı.
- `faz-gelistirme-checklist-tr.md` — Faz 13–17 ve Faz 4 için yapılacaklar (`[ ]` / `[x]`).
- `activeContext.md` — Güncel faz, operasyonel backlog öneri havuzu.
- `progress.md` — Ne çalışıyor / sırada ürün maddeleri.
- `mvp-metrics.md` — Trafik ve dönüşüm metrikleri tanımı.
