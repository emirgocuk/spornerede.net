# SporNerede.net — Sistem Desenleri (System Patterns)

## Mimari Genel Bakış

```
┌─────────────────────────────────────────────┐
│               Cloudflare CDN                │
│          (DNS + SSL + DDoS Koruma)          │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│            Nginx (Reverse Proxy)            │
│              Ubuntu 22.04 LTS               │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│         Astro.js SSR/SSG (Node.js)          │
│  ─────────────────────────────────────────  │
│  /src/pages/       → Rotalar & sayfalar     │
│  /src/components/  → Yeniden kull. bileşen. │
│  /src/layouts/     → Sayfa şablonları       │
│  /src/styles/      → Global CSS             │
│  /public/          → Statik varlıklar       │
└──────────────────┬──────────────────────────┘
                   │ (Gelecekte)
┌──────────────────▼──────────────────────────┐
│     PostgreSQL + PostGIS (Self-Hosted)      │
│         Drizzle ORM ile bağlantı            │
└─────────────────────────────────────────────┘
```

## Bileşen Mimarisi

### Layout Katmanı

```
BaseLayout.astro
  ├── <head> (meta, font, SEO)
  ├── Header.astro
  ├── <slot /> (sayfa içeriği)
  └── Footer.astro
```

### Sayfa Hiyerarşisi

```
index.astro              → Landing (tanıtım: hero + haberler + branşlar + CTA) [UYGULANDI]
ara.astro                → Arama sayfası (arama çubuğu üstte + filtreler + sonuçlar altta) [UYGULANDI]
basvuru.astro            → Kulüp başvuru formu [UYGULANDI]
branslar/
  └── index.astro        → Tüm branşlar listesi [UYGULANDI]
  └── [brans].astro      → Branş detay sayfası (dinamik rota) [UYGULANDI]
kulupler/
  └── index.astro        → Kulüp listeleme (ara.astro ile entegre)
  └── [id].astro         → Kulüp detay sayfası [UYGULANDI]
api/
  └── basvuru.ts         → POST endpoint: form alır, Nodemailer ile e-posta gönderir [UYGULANDI]
```

## Header Navigasyon Yapısı

### Masaüstü Menü (Sade)

```
[Logo: spor nerede?]   [Haberler]   [Hakkımızda]   [İletişim]   [Spor Kursunu/Kulübünü Ekle →]
```

### Mobil Menü

- Hamburger ikonla açılan tam ekran veya side-drawer menü
- Arama çubuğu mobilde de erişilebilir

## Landing Page Hero Bölümü (`/`)

```
┌─────────────────────────────────────────────────┐
│  [Badge: Şehir rotator + Türkiye'nin En Kapsamlı Spor Rehberi]  │
│                                                 │
│  SPOR NEREDE?                                   │
│  Çocuğun için spor kursu veya kulüp bul         │
│                                                 │
│  [İl yaz] [İlçe yaz] [Branş yaz] [Ara →]            │
│   ↓ Submit → /ara?il=ankara&ilce=cankaya&brans=futbol     │
│                                                 │
│  (Popüler etiket satırı kaldırıldı)               │
└─────────────────────────────────────────────────┘
```

Landing Page arama formu submit olduğunda `/ara` sayfasına URL parametresiyle yönlendirilir. Hero alanında yazı tabanlı suggestion paneli en yakın 3 öneriyi gösterir.

## Arama Sayfası Yapısı (`/ara`)

```
┌─────────────────────────────────────────────────────────────────────┐
│ [STICKY HEADER: Logo + Nav]                                        │
├─────────────────────────────────────────────────────────────────────┤
│ [Branş▾ | Ara]   (sticky üst; secili il/ilce gizli alanlarla korunur) │
├─────────────────────────────────────────────────────────────────────┤
│ [Sol: Il/Ilce sec + Uygula] │ [Sag: Sonuc sayisi + Kulup kartlari] │
├─────────────────────────────────────────────────────────────────────┤
│  Secilen bolgede 47 futbol kursu bulundu                            │
│                                                                     │
│  [Kulüp Kartı]  [Kulüp Kartı]  [Kulüp Kartı]                       │
│  [Kulüp Kartı]  [Kulüp Kartı]  [Kulüp Kartı]                       │
│  ...                                                                │
└─────────────────────────────────────────────────────────────────────┘
```

## Haber/Duyuru + FAQ Bölümü

### Masaüstü Düzeni (İki Sütunlu)

```
[Haberler / Duyurular]
├── Maraton Duyuruları
├── Hakemlik Başvurusu
├── Milli Sporcu...
└── Etkinlik Takvimi

[Sıkça Sorulan Sorular]
├── Platform nedir?
├── Kulüp nasıl eklenir?
└── Türkiye geneli hizmet kapsamı
```

### Mobilde

- Haberler üstte, FAQ altında yığılır

## Veri Akışı Desenleri

### Arama Formu Akışı (Aşama 1 — Statik)

```
Kullanıcı input → URL parametresi → /ara?ilce=cankaya&brans=futbol
```

### Arama Formu Akışı (Aşama 2 — Dinamik)

```
Kullanıcı input → API endpoint → PostgreSQL sorgu → JSON yanıt → Astro render
```

## Tasarım Token Sistemi

```css
/* global.css */
@theme {
  --color-brand-red: #E30A17;        /* Ana kırmızı */
  --color-brand-red-dark: #B5080F;   /* Koyu kırmızı (hover) */
  --color-brand-red-light: #FF2D3A;  /* Açık kırmızı (vurgu) */
  --color-brand-white: #ffffff;
  --color-brand-gray-50: #F8F9FA;
  --color-brand-gray-100: #F1F3F5;
  --color-brand-gray-800: #1A1A1A;
  --color-brand-gray-900: #0D0D0D;
  --font-brand: 'Outfit', sans-serif;
}
```

## SEO Deseni

Her sayfa şu meta tagları içerecek:

```astro
<title>{pageTitle} | SporNerede.net</title>
<meta name="description" content="{description}" />
<meta name="keywords" content="{keywords}" />
<meta property="og:title" content="{pageTitle}" />
<meta property="og:description" content="{description}" />
<link rel="canonical" href="{canonicalUrl}" />
```

Dinamik sayfa örnekleri:

- `/branşlar/futbol` → "Ankara Futbol Kursları ve Kulüpleri | SporNerede.net"
- `/kulupler/ankara/cankaya` → "Çankaya Spor Kulüpleri | SporNerede.net"

## Başvuru Formu Akışı

```
Kulüp "Kulübünü Ekle" butonuna basar
  → basvuru.astro sayfasına yönlenir
  → Formu doldurur (kulüp adı, branş, telefon, adres, açıklama)
  → Astro API endpoint: POST /api/basvuru
  → Nodemailer (self-hosted SMTP) → kurucu e-postasına bildirim
  → Kulübe teşekkür mesajı gösterilir
```

**E-posta Altyapısı: Self-Hosted Nodemailer**

- Kendi SMTP sunucusu (aynı Ubuntu 22.04 üzerinde Postfix veya harici SMTP portu)
- Nodemailer paketi Astro server endpoint içinde kullanılır
- `.env` dosyasında: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_TO`

## Veri Akışı Desenleri

