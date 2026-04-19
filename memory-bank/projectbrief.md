# SporNerede.net — Proje Özeti (Project Brief)

## Proje Adı
**SporNerede.net**

## Kurucu
Murat Aktaş

## Vizyon
Türkiye genelinde spor branşları, kursları ve kulüpleri kapsayan kapsamlı bir rehber platformu.

> "Türkiye'nin en kapsamlı spor branş ve kulüp rehberi"

## Temel Amaç
Kullanıcıların (özellikle ebeveynler ve yetişkinler) spor branşlarını, kursları ve tesisleri **bulup karşılaştırabileceği** modern, hızlı ve SEO odaklı bir web platformu oluşturmak.

## Hedef Kitle
- **Ebeveynler:** Çocukları için en uygun spor branşını, kursunu veya kulübünü bulmak isteyenler
- **Yetişkinler:** Kendi ilgi alanlarına yönelik branş spesifik kurs ve antrenör arayanlar

## Zorunlu Sloganlar ve İfadeler
- ⚠️ **"spor nerede?"** — sayfada dikkat çekici şekilde mutlaka yer almalı
- Ana başlık/odak cümlesi: **"Çocuğun için spor kursu veya kulüp bul"**
- "Sporu keşfet harekete geç"
- "Adresinize en yakın spor kursları ve kulüpler bir tık uzağınızda."

## Renk Paleti
- **Ana renk:** Kırmızı (`#E30A17` — Türk bayrağı kırmızısı)
- **Yan renk:** Beyaz (`#ffffff`)
- **Ara tonlar:** Açık gri, koyu gri (nötr), kırmızının daha açık/koyu tonları

## Kapsam — İlk Aşama (Landing Page + Arama)

### Sayfa Yapısı
1. **Header (Üst Menü):** Logo + akıllı navigasyon + **Üye girişi** (`/panel/giris`, CTA’nın solunda) + kulüp başvuru CTA
2. **Hero / Arama Alanı:** Tam ekran etkileyici bölüm, arama çubuğu, sloganlar
3. **Haberler ve Duyurular Bölümü:** Sol menü/sütun, kayan bant (maraton, etkinlik, müdürlük vb.)
4. **Sıkça Sorulan Sorular Bölümü:** Kullanıcıya hızlı bilgi veren açılır SSS
5. **Kulüp Başvuru Formu Yönlendirmesi:** Kulüplerin/kursların başvurabileceği alan
6. **Footer:** İletişim, linkler, telif (sadeleştirilmiş sütun yapısı)

## Kulüp ve yönetim (operasyon)
- **Başvuru (`/basvuru`):** Form; ileride ek bilgi, **dekont ve belge yükleme**; yönetim onayından sonra yayınlanan kulüp profili ve temsilci paneli hesabı. Ayrıntı: `club-auth-admin-plan.md`.
- **Kulüp paneli (`/panel/*`):** Giriş ve sonrasında profil, kurs/program yönetimi (aşamalı); oturum açıkken header’da simge + dropdown, mobilde hamburger içi iç içe menü.
- **Yönetim (`/admin`):** Başvuru inceleme ve onay/red; referans veriler (il, ilçe, branş); kulüp sayfalarını görüntüleme ve metin düzenleme. Hedef düzen: sağda kuyruk listesi, detay/aksiyon alanı.

## Son UI Kararları (Nisan 2026)
- Landing ve metin dili **Ankara odaklı** ifadelerden **Türkiye geneline** taşındı.
- Header menüsü sadeleştirildi: `Haberler`, `Hakkımızda`, `İletişim`.
- Hero badge içinde şehir isimleri dönen yapı eklendi (öncelik: Ankara, İstanbul, İzmir, Adana).
- Hero arama alanı select yerine yazı tabanlı autocomplete davranışına geçirildi.
- Club CTA bölümünde sağ tarafta medya alanı, arka planla harmanlanmış geçişli vitrin olarak tasarlandı.

### Gelecek Özellikler (Altyapı Hazır Olacak)
- Akıllı Eşleştirme Sihirbazı (Quiz: "Çocuğunuz Hangi Spora Yatkın?")
- Harita entegrasyonu (Aşamalı: iframe → liste → Mapbox)
- Gelişmiş filtreleme (fiyat, program, antrenör, deneme dersi)
- Sosyal kanıt sistemi (veli yorumları ve puanlaması)
- Premium kulüp ilanları (öne çıkarma)
- Lead yönlendirme komisyon modeli
- E-ticaret / affiliate ekipman yönlendirme

## İş Modeli
1. Ücretli üyelik paketleri + öne çıkarma (Premium)
2. "Kayıt Ol" / "Bilgi Al" lead yönlendirme komisyonu
3. Affiliate ekipman satışı (spor mağazası ortaklıkları)
