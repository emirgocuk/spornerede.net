# SporNerede.net — Kurulum Checklist (TR)

Bu dosya, projeyi yeni bir sunucuda veya temiz bir ortamda ayağa kaldırmak için minimum adımları içerir.

## 1) Önkoşullar

- Node.js 22+ kurulu
- PostgreSQL kurulu ve erişilebilir
- Nginx kurulu ve reverse proxy için hazır
- Domain + SSL yönlendirmesi hazır

## 2) Proje ve Ortam

- Repo sunucuya alındı
- `/opt/spornerede` klasör yapısı hazır
- `/opt/spornerede/.env` oluşturuldu
- `.env` içinde zorunlu alanlar tanımlandı:
  - `DATABASE_URL`
  - `SITE_URL`
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
  - `MAIL_TO`
  - `ADMIN_TOKEN`

## 3) Veritabanı Hazırlığı

- Migration çalıştırıldı (`npm run db:migrate`)
- İlk seed çalıştırıldı (`npm run db:seed`)
- Demo gösterimi için demo seed çalıştırıldı (`npm run demo:seed`) (opsiyonel ama önerilir)

## 4) Uygulama Servisi

- `spornerede.service` systemd dosyası yerinde
- `systemctl daemon-reload` çalıştırıldı
- `systemctl enable --now spornerede` çalıştırıldı
- `systemctl status spornerede` sağlıklı

## 5) Nginx ve Yayın

- Nginx config Node portuna proxy ediyor
- `nginx -t` başarılı
- `systemctl reload nginx` başarılı
- Canlı URL’de `/`, `/ara`, `/basvuru` açılıyor

## 6) İlk Kullanıcılar ve Onboarding

- Admin kullanıcı oluşturuldu (`npm run user:create -- ... admin`)
- Gerekli kulüp kullanıcıları oluşturuldu/bağlandı (`user:assign-club` veya admin panel onboarding)
- Panel login doğrulandı (`/panel/giris`)
- Geçici şifre verilen kullanıcıda ilk girişte şifre değiştirme akışı doğrulandı (`/panel/sifre-degistir`)

## 7) Doğrulama

- `GET /api/health` başarılı
- `GET /api/health?deep=1` beklenen durumda
- `GET /api/metrics` metrikleri dolu dönüyor
- `memory-bank/test-checklist-tr.md` üzerinden temel testler çalıştırıldı