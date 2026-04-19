# SporNerede.net — Ürün Bağlamı (Product Context)

## Neden Bu Proje Var?

Türkiye'de ebeveynler ve yetişkinler, çocukları veya kendileri için **uygun spor kursunu veya kulübünü bulmakta** ciddi güçlük çekmektedir. Mevcut arama yöntemleri (Google, Instagram, kulaktan dolma) dağınık, güvensiz ve zaman alıcıdır.

SporNerede.net bu sorunu çözmek için:
- Tek bir platformda tüm spor kulüplerini listeler
- Konum, branş, fiyat bazlı filtreleme sunar
- Güven unsuru olarak veli yorumları içerir
- Kulüplerle doğrudan iletişim / başvuru sağlar

## Çözülen Problemler

| Problem | Çözüm |
|---|---|
| "Hangi sporu seçmeli?" belirsizliği | Akıllı eşleştirme quiz'i |
| Yakın kulüp/kurs bulmak zor | Konum bazlı filtreleme ve harita |
| Kulüplerin güvenilirliği belirsiz | Veli puanlama/yorum sistemi |
| Fiyat karşılaştırması yapılamıyor | Standartlaştırılmış profil kartları |
| Kulüplere erişim güç | Doğrudan başvuru / "Bilgi Al" butonu |

## Kullanıcı Deneyimi Hedefleri

### Birincil Kullanıcı Akışı (Ebeveyn)
```
Siteye gel → Hero'da arama yap (şehir / branş) →
Filtrelenmiş kulüp listesi gör → Kulüp profiline gir →
Yorumları oku → "Bilgi Al" / "Kayıt Ol" butonuna bas
```

### İkincil Kullanıcı Akışı (Quiz)
```
"Çocuğunuz hangi spora yatkın?" sorusunu gör →
4 soruluk quiz'i tamamla → 3 öneri branş + altındaki kurslar listelenir
```

### Kulüp / İşletme Akışı
```
Header'daki "Kulübünü Ekle" butonuna bas →
Başvuru formunu doldur → E-posta bildirimi alınır → Onay süreci
```

## Platform Özellikleri (Öncelik Sırası)

### 🔴 Aşama 1 — Landing Page (Şimdiki Odak)
- [x] Akıllı Header + hamburger menü (mobil)
- [x] Hero bölümü (öne çıkan slogan + arama çubuğu)
- [x] Duyuru/Haber bandı (sol sütun / kayan bant)
- [x] Sıkça Sorulan Sorular bölümü
- [x] Kulüp başvuru formu (ya da yönlendirme sayfası)
- [x] Footer

### 🟡 Aşama 2 — Arama & Listeleme
- [x] Branş ve şehir bazlı filtreleme
- [x] Kulüp liste sayfası (kart tasarımı)
- [x] Kulüp detay sayfası (profil, harita iframe, iletişim)
- [x] Temel SEO meta tagleri (her sayfa için)

### 🟢 Aşama 3 — Kullanıcı Özellikleri
- [ ] Akıllı eşleştirme quiz'i
- [ ] Konum bazlı "yakınımdakiler" özelliği
- [ ] Veli yorum/puanlama sistemi
- [ ] Gelişmiş filtreleme (fiyat, program, sertifika vb.)

### 🔵 Aşama 4 — Monetizasyon
- [ ] Premium kulüp öne çıkarma
- [ ] Ücretli üyelik paketleri
- [ ] Lead komisyon sistemi
- [ ] Affiliate ekipman linkleri

## İçerik Stratejisi

### SEO Hedefi
Anahtar kelimeler:
- "Türkiye basketbol kursu"
- "çocuğuma spor kursu"
- "yüzme kulübü"
- "[ilçe] [branş] kurs"

Her branş ve her ilçe için alt sayfa oluşturulacak → Yüzlerce SEO sayfası.

### Haber/Duyuru Kaynakları
- Spor il müdürlüğü etkinlikleri
- Maraton ve turnuva duyuruları
- Hakemlik/antrenörlük başvuruları
- Milli sporcu başarıları

## Tasarım Prensipleri
- Kırmızı-beyaz ana palet, Türk bayrak kimliği
- Outfit font — güçlü, modern, okunabilir
- Mobil-first tasarım
- Glassmorphism, blur efektleri (mevcut stilde başlatıldı)
- Hızlı yükleme (Astro SSG/SSR → minimum JS)
