# Nginx Çökme Postmortem — 15 Eylül 2026

## Olay Özeti
Tarih: 2026-09-15 06:07 UTC (~09:07 TR saati)
Süre: ~12 saat downtime (06:07 → 18:58 UTC)
Etki: spornerede.net tamamen erişilemez (port 80 ve 443 kapalı)

## Kök Neden
`/etc/nginx/sites-available/spornerede.net` dosyasında `ssl_dhparam` direktifi **iki kez** yazılmıştı:

```nginx
# Satır 28: ssl_certificate_key ile aynı satırda yapışık
ssl_certificate_key /etc/letsencrypt/live/spornerede.net/privkey.pem;ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
# Satır 30: tekrar ayrı satırda
ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
```

Nginx `ssl_dhparam` duplicate directive hatası verdi ve başlayamadı.

## Tetikleyen Olay
`apt-daily-upgrade` servisi nginx paketini güncelledi → nginx restart oldu → bozuk config ile başlayamadı.

## Bug Kaynağı: deploy.sh
`deploy.sh` içindeki Python SSL metadata extraction script'inde (satır ~391-471):

1. Mevcut vhost dosyasından satır satır `ssl_dhparam` aranıp `includes` listesine ekleniyor
2. Eğer mevcut config bulunamazsa, `/etc/letsencrypt/ssl-dhparams.pem` dosyası kontrol edilip tekrar `includes`'e ekleniyor
3. **Dedup yapılmıyordu** — her iki yoldan da ekleme olunca duplicate oluşuyordu
4. Ayrıca mevcut config'den satır taranırken, bir satırda birden fazla direktif varsa (`;` ile ayrılmış), bunlar da yanlış parse ediliyordu

## Yapılan Düzeltme
`deploy.sh` içine `add_include()` helper fonksiyonu eklendi. Bu fonksiyon:
- Directive key'ini (`ssl_dhparam`, `include` vb.) bir `set` ile takip eder
- Aynı directive key zaten eklenmişse, tekrar eklemez
- Hem mevcut config parse bloğunda hem de fallback (letsencrypt dizin tarama) bloğunda kullanılır

## KURALLAR (Gelecek Oturumlar İçin)

### deploy.sh Nginx Config Oluşturma
- `includes` listesine ekleme yaparken **HER ZAMAN** `add_include()` fonksiyonunu kullan
- Yeni bir SSL/include direktifi eklerken duplicate kontrolü yap
- Config oluşturulduktan sonra `nginx -t` testi deploy.sh içinde zaten var ama **hata durumunda rollback** mekanizması eklenmeli (TODO)

### Nginx Config Format
- Her direktif kendi satırında olmalı, aynı satırda `;` ile birden fazla direktif yazılmamalı
- `ssl_dhparam` sadece **bir kez** olmalı (nginx bunu duplicate olarak reddeder)

### Sunucu Bakımı
- Sunucu IP: 45.155.19.82
- SSH: root@45.155.19.82
- Node app: port 3000 (systemd: spornerede.service)
- PocketBase: port 8090 (systemd: spornerede-pocketbase.service)
- Nginx: reverse proxy, sites-enabled/spornerede.net → sites-available/spornerede.net
- Auto-update: spornerede-autoupdate.service (git pull + build)
- **ÖNEMLİ**: `apt-daily-upgrade` nginx'i restart edebilir — config her zaman valid olmalı

### Brute Force Uyarısı
- 109.160.32.18 IP'sinden aktif SSH brute force saldırısı var
- fail2ban kurulumu değerlendirilmeli (TODO)
