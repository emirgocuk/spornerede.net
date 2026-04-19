# SporNerede.net - Teknolojik Altyapı ve Yol Haritası

## 1. Proje Vizyonu
Kullanıcıların kendi bölgelerindeki veya hedeflenen konumlardaki spor kulüplerini (kursları) bulmalarını, fiyatlarını/hizmetlerini karşılaştırmalarını ve platform üzerinden başvuru yapabilmelerini sağlayan modern, hızlı ve ölçeklenebilir bir web platformu.

## 2. Teknoloji Yığını (Tech Stack)

### Frontend (Kullanıcı Arayüzü)
*   **Framework:** **Astro.js (SSR Mode)**. Yüksek performans, SEO uyumluluğu ve sıfır gereksiz JavaScript yükü sunması sebebiyle projelerin hızlı açılmasını sağlar. SEO gerektiren "directory" (dizin) projeleri için en doğru standarttır.
*   **Stil/Tasarım:** **TailwindCSS**. Özelleştirilebilir ve çok güncel bir CSS framework'ü olduğu için premium hissettiren, modern ve mobil uyumlu tasarımları en kolay şekilde elde etmemizi sağlar.

### Backend ve Veritabanı
*   **Veritabanı:** **PostgreSQL**. Kendi sunucumuzda (self-hosted) stabil çalışan, veriyollarının hızlı olduğu ve yüksek büyüme hacmine karşı çok dirençli bir sistemdir.
*   **Konum/Harita Yatkınlığı:** İlerisi için **PostGIS** destekleyebilen PostgreSQL ile enlem (latitude) ve boylam (longitude) verileri en başarılı şekilde tutulacak, "konumuma yakın olanları filtrele" hesaplamaları tamamen veritabanına bırakılacaktır.
*   **ORM (Bağlantı Mimarisi):** **Drizzle ORM**. Piyasada bulunan en hafif (lightweight) SQL kontrol altyapısıdır. RAM ve işlemci tasarrufu sağlarken performansı düşürmez. Astro.js ile mükemmel şekilde çalışır.

### Sunucu ve Ağ (Bitti ✔️)
*   **Sunucu İşletim Sistemi:** Ubuntu 22.04 LTS (Self Hosting)
*   **Yayın Sunucusu:** Nginx
*   **Ağ Yönetimi ve Güvenlik:** Cloudflare (DNS, HTTPS sertifikaları ve DDoS koruması).

## 3. Harita Entegrasyonu ve Gelecek Vizyonu

Aşamalı gelişim modeli ile platformun teknik yükü minimumda tutulup, aşama aşama gerçek bir harita tabanlı uygulamaya dönüşümü hedeflenmektedir:

*   **Aşama 1 (Başlangıç):** Kulüp kayıtlarına koordinat verisi (Enlem/Boylam) girilecek, kulüp detay sayfalarında sade ve performansı yormayan **Google Maps Iframe** entegrasyonu sunulacaktır.
*   **Aşama 2 (Listeleme):** Kullanıcıdan alınan "Konumuma İzin Ver" yetkisiyle, PostgreSQL tabanındaki matematiksel altyapı sayesinde "Size en yakın X kilometredeki kurslar" **liste şeklinde** uzaklık değerleriyle gösterilecektir (örnek: "Sana 2.4 km uzaklıkta").
*   **Aşama 3 (Kendi Haritamız):** İlgili sayfaya **Mapbox** (veya Leaflet.js) entegrasyonu sağlanarak, tıpkı Airbnb gibi büyük ekranda interaktif ikonların (pinlerin) bulunduğu harita deneyimine sorunsuzca geçiş yapılacaktır.

## 4. Kullanıcı İletişim ve Başvuru Senaryosu
Astro.js'nin kendi yetenekleri üzerinden; harici karmaşık bir "Backend Framework" yüklemeden veri alınacak, kayıt formları doldurtularak ilgili kulübe anında güvenli bir şekilde e-posta bildirimi vb. entegrasyonlar kolayca sağlanacaktır. 
