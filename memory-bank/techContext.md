# SporNerede.net — Teknik Bağlam (Tech Context)

## Kullanılan Teknoloji Yığını

### Frontend
| Teknoloji | Versiyon | Kullanım Amacı |
|---|---|---|
| **Astro.js** | ^6.1.6 | SSR/SSG framework, SEO, hızlı sayfa yüklemesi |
| **TailwindCSS** | ^4.2.2 | Utility-first CSS, modern tasarım |
| **@tailwindcss/vite** | ^4.2.2 | Astro+Tailwind integrasyon eklentisi |
| **@astrojs/node** | ^9.1.1 | SSR için Node.js adapter |
| **@astrojs/sitemap** | ^3.2.1 | Otomatik sitemap üretimi |
| **Nodemailer** | ^6.9.16 | Form başvuruları için SMTP e-posta |
| **Outfit (Google Fonts)** | — | Ana yazı tipi |

### Backend & Altyapı (Planlanan)
| Teknoloji | Kullanım Amacı |
|---|---|
| **PostgreSQL** | Ana veritabanı (self-hosted) |
| **PostGIS** | Coğrafi konum sorguları |
| **Drizzle ORM** | Hafif, type-safe SQL ORM |

### Sunucu & Ağ
| Teknoloji | Durum | Kullanım |
|---|---|---|
| Ubuntu 22.04 LTS | ✅ Aktif | Sunucu OS (self-hosted) |
| Nginx | ✅ Aktif | Web sunucusu / reverse proxy |
| Cloudflare | ✅ Aktif | DNS, SSL, DDoS koruması |

## Geliştirme Ortamı

### Komutlar
```bash
npm run dev      # Geliştirme sunucusu (http://localhost:4321)
npm run build    # Production build
npm run preview  # Build önizleme
```

## Deploy (kisa)
- `deploy.sh` / `rollback.sh`: SSH + rsync ile release dagitimi
- `deploy/spornerede.service.example`: systemd unit ornegi
- Detay: `memory-bank/deploy-runbook.md`

### Proje Dosya Yapısı
```
spornerede.net/
├── src/
│   ├── layouts/
│   │   └── BaseLayout.astro      # Ana sayfa şablonu (SEO)
│   ├── pages/
│   │   ├── index.astro          # Landing Page
│   │   ├── ara.astro            # Arama sonuçları
│   │   ├── basvuru.astro        # Kulüp başvuru formu
│   │   └── api/
│   │       └── basvuru.ts       # E-posta API endpoint (Nodemailer)
│   ├── components/
│   │   ├── Header.astro         # Navigasyon (Sade + Sticky)
│   │   ├── Hero.astro           # Hero + yazı tabanlı autocomplete
│   │   ├── NewsBar.astro        # Haber/duyuru bölümü
│   │   ├── FAQSection.astro     # Sıkça sorulan sorular
│   │   ├── ClubCTA.astro        # Kurs/kulüp başvuru çağrısı + medya vitrin
│   │   └── Footer.astro         # Footer (sade sütunlar)
│   ├── assets/
│   │   └── images/              # Landing CTA medya görselleri (.webp)
│   └── styles/
│       └── global.css           # Tasarım atomları, tokenlar ve animasyonlar
├── public/                       # robots.txt, sitemap-index.xml
├── memory-bank/                  # Proje dökümantasyonu
├── astro.config.mjs              # Adapter & Integration ayarları
├── .env.example                  # SMTP & URL çevre değişkenleri şablonu
└── package.json
```

## Mevcut Durum
- ✅ Astro.js + TailwindCSS 4 kurulu ve yapılandırıldı
- ✅ Sunucu (nginx + Cloudflare) kurulu ve çalışıyor
- ✅ SSR modu aktif (Node adapter)
- ✅ Tam tasarım sistemi (`global.css`) hazır
- ✅ Ana sayfa (Landing), Arama ve Başvuru sayfaları tamamlandı
- ✅ Nodemailer API endpoint hazır
- ✅ SEO temel altyapısı (robots, sitemap, meta) hazır
- ✅ Landing hero search: custom suggestion panel (top 3 prediction)
- ✅ Landing CTA: sağda arka plan benzeri medya geçişli vitrin

## Teknik Kısıtlar
- Node.js >= 22.12.0 zorunlu
- Renk paleti: Türk bayrağı kırmızısı (#E30A17) + beyaz, ara tonlar
- Yazı tipi: sadece Outfit

## Harita Entegrasyonu Yol Haritası
1. **Aşama 1:** Google Maps iframe (kulüp detay sayfasında)
2. **Aşama 2:** PostgreSQL < PostGIS ile "konumuma yakın" liste
3. **Aşama 3:** Mapbox / Leaflet.js interaktif harita
