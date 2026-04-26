# SporNerede.net — Deploy Runbook (Basit Sürüm)

## Amaç

Deploy sürecini tekrarlanabilir ve düşük riskli hale getirmek.

## Canlı Durum Özeti (2026-04-26)

- Production sunucu: `root@45.155.19.82`
- App service: `spornerede`
- PocketBase service: `spornerede-pocketbase`
- Backup timer: `spornerede-backup.timer`
- App current symlink: `/opt/spornerede/current`
- Release dizini: `/opt/spornerede/releases/<timestamp>`
- Production env: `/opt/spornerede/.env`
- Production credential notu: `/opt/spornerede/production-credentials.txt` (root-only, repoya yazılmaz)
- PocketBase data: `/opt/spornerede/pocketbase/pb_data`
- PocketBase public/uploads: `/opt/spornerede/pocketbase/pb_public`

İlk canlı release elle yüklendi ve smoke check geçti:

- `/`
- `/ara`
- `/basvuru`
- `/api/health?deep=1`

Not: Brevo SMTP ayarları girildikten sonra deep health `ok` döndü.

## Deploy Öncesi Kontrol

- `npm ci` ve `npm run build` lokal başarılı
- `npm run release:gate` başarılı (deploy zorunlu ön kontrol)
- Gerekli env değerleri hazır: `SITE_URL`, `POCKETBASE_URL`, `POCKETBASE_ADMIN_EMAIL`, `POCKETBASE_ADMIN_PASSWORD`
- Mail canlı testi yapılacaksa `SMTP_*`, `MAIL_FROM`, `MAIL_TO`, `MAIL_QUEUE_TOKEN`
- Son değişikliklerde kritik sayfalar test edildi: `/`, `/ara`, `/basvuru`
- `robots.txt` ve sitemap erişilebilir durumda
- Windows: `npm run dev` acikken `npm ci` cogu zaman `EPERM` verir; deploy oncesi dev server'i durdurun

## Yeni Versiyon Yayınlama Akışı

### Hedef Model: Sunucu Pull + systemd Timer

Normal hedef şudur:

1. Değişiklikler lokal geliştirilir.
2. `npm run build` temiz geçer.
3. Değişiklikler `main` branch'e push edilir.
4. Sunucudaki `spornerede-autoupdate.timer` periyodik olarak yeni commit'i görür.
5. `deploy/server-auto-update.sh` şunları yapar:
   - `git fetch`
   - repo temizse `git pull --ff-only`
   - `npm ci`
   - `npm run release:gate`
   - `npm run build`
   - `npm run pb:setup`
   - yeni release klasörü oluşturma
   - `dist/`, `package.json`, `package-lock.json` kopyalama
   - release içinde `npm ci --omit=dev`
   - `/opt/spornerede/current` symlink update
   - `systemctl restart spornerede`
   - `npm run smoke:check`

Astro SSR notu: `dist/` tek başına yeterli değildir. Runtime için release içinde production `node_modules` bulunmalıdır.

### Şu Anki Geçici Durum

GitHub repo private olduğu için sunucu `git clone/pull` işlemi deploy key ile çalışır. Deploy key eklendi ve doğrulandı.

GitHub'a eklenecek public deploy key:

```text
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIKVpmouLvpxNyzPl4uR0z1nAN5Fnv9I4snMKmkwikbr2 spornerede-prod-deploy
```

GitHub yolu:

1. Repo `Settings`
2. `Deploy keys`
3. `Add deploy key`
4. Title: `spornerede-prod-deploy`
5. Key: yukarıdaki public key
6. `Allow write access`: kapalı

Sunucuda doğrulanan kurulum:

```bash
git clone git@github.com:emirgocuk/spornerede.net.git /opt/spornerede/repo
systemctl daemon-reload
systemctl enable --now spornerede-autoupdate.timer
systemctl start spornerede-autoupdate.service
journalctl -u spornerede-autoupdate.service -n 100 --no-pager
```

### Geçici Elle Deploy

Timer tamamen açılmadan önce elle deploy gerekirse:

1. Lokalde `npm run build`
2. Yeni release dizini oluştur:
   - `/opt/spornerede/releases/YYYYMMDDTHHMMSSZ`
3. `dist/` içeriğini release'e yükle.
4. `package.json` ve `package-lock.json` dosyalarını release'e yükle.
5. Sunucuda release içinde `npm ci --omit=dev`
6. `ln -sfn <release> /opt/spornerede/current`
7. `systemctl restart spornerede`
8. `SITE_URL=https://spornerede.net npm run smoke:check`

## Standart Deploy Akışı (Genel)

1. Sunucuda güncel kodu al.
2. Bağımlılıkları kur (`npm ci`).
3. Build al (`npm run build`).
4. PocketBase schema sync çalıştır (`npm run pb:setup`).
5. Yeni release oluştur ve `current` symlink'i güncelle.
6. Uygulamayı yeniden başlat (`systemctl restart spornerede`).
7. Sağlık kontrolü yap:
  - Ana sayfa açılıyor mu
  - `/ara` filtreleniyor mu
  - `/basvuru` form gönderimi çalışıyor mu

## Deploy Modeli (GitHub Actions kapali)

Bu projede GitHub Actions deploy workflow'u bilerek kapatildi.

Neden:

- Ek GitHub Actions maliyetinden kacinmak
- Deploy kontrolunu tamamen self-host sunucu akisiyla surdurmek

Sonuc:

- `main` push -> GitHub Actions tetiklenmez (deploy karari sunucu timer'i tarafinda verilir)
- Deploy hedef modeli sunucu timer ile `git pull` modelidir.
- Timer açılana kadar deploy geliştirici makinesinden SSH/SCP release akışıyla yapılabilir.

## Sunucudan Otomatik Guncelleme (GitHub pull modeli)

GitHub Actions maliyeti olmadan otomatik deploy icin sunucu tarafinda systemd timer kullanilir.
Timer periyodik olarak repo'yu kontrol eder, yeni commit varsa `pull + build + release + restart` yapar.

### 1) Sunucuda repo klonla

```bash
sudo mkdir -p /opt/spornerede
cd /opt/spornerede
sudo git clone git@github.com:emirgocuk/spornerede.net.git repo
```

Not:

- Sunucuda GitHub'a erisen bir SSH key olmali.
- Repo temiz degilse otomatik guncelleme bilerek atlanir.

### 2) Auto-update service ve timer kur

Repo icindeki ornek dosyalari systemd altina kopyalayin:

```bash
sudo cp /opt/spornerede/repo/deploy/spornerede-autoupdate.service.example /etc/systemd/system/spornerede-autoupdate.service
sudo cp /opt/spornerede/repo/deploy/spornerede-autoupdate.timer.example /etc/systemd/system/spornerede-autoupdate.timer
sudo systemctl daemon-reload
sudo systemctl enable --now spornerede-autoupdate.timer
```

### 3) Calismayi dogrula

```bash
sudo systemctl status spornerede-autoupdate.timer --no-pager
sudo systemctl list-timers --all | grep spornerede-autoupdate
sudo journalctl -u spornerede-autoupdate.service -n 100 --no-pager
```

### 4) Elle test et (ilk kurulumda onerilir)

```bash
sudo systemctl start spornerede-autoupdate.service
sudo journalctl -u spornerede-autoupdate.service -n 100 --no-pager
```

Timer calisma araligi varsayilan olarak 1 dakikadir (`OnUnitActiveSec=1min`).
Isterseniz `deploy/spornerede-autoupdate.timer.example` icinde araligi buyutebilirsiniz.

## Backup Altyapısı

Canlı backup kapsamı:

- `/opt/spornerede/.env`
- `/opt/spornerede/pocketbase/pb_data`
- `/opt/spornerede/pocketbase/pb_public`
- release metadata

Repo tarafı:

- `deploy/server-backup.sh`
- `deploy/spornerede-backup.service.example`
- `deploy/spornerede-backup.timer.example`

Sunucuda aktif:

```bash
systemctl status spornerede-backup.timer --no-pager
systemctl list-timers spornerede-backup.timer --no-pager
ls -lah /opt/spornerede/backups
```

Elle backup test:

```bash
systemctl start spornerede-backup.service
journalctl -u spornerede-backup.service -n 100 --no-pager
```

Offsite hedef seçilince `/opt/spornerede/.env` içine eklenir:

```env
OFFSITE_BACKUP_TARGET=backup@IP:/srv/backups/spornerede
LOCAL_RETENTION_DAYS=7
OFFSITE_RETENTION_DAYS=30
```

Sonra tekrar `systemctl start spornerede-backup.service` ile test edilir.

### Admin Panelden Manuel Backup

İlk canlı kullanım kararı:

- Offsite otomasyonu yerine başlangıçta admin panelden manuel backup indirilecek.
- Admin panelinde `Yedekler` sekmesi bulunur.
- `Yedek Oluştur ve İndir` butonu anlık `.tar.gz` arşivi üretir.
- İndirilen arşiv şunları içerir:
  - `pb_data`
  - `pb_public`
- İndirilen arşiv şunları içermez:
  - `/opt/spornerede/.env`
  - SMTP key
  - admin token
  - üretim credential dosyaları

Önerilen pratik:

- Ayda 1 kez admin panelden backup indir.
- Bilgisayarda ve mümkünse harici disk/cloud klasörde sakla.
- Büyük veri artışı veya 1000 kulüp seviyesine yaklaşınca otomatik offsite hedef tekrar değerlendir.

Canlı test:

```bash
GET /api/admin/backup-download
```

Admin yetkisiyle 200 döndü; arşiv içinde `pb_data/` ve `pb_public/` doğrulandı.

Restore şimdilik admin panelden yapılmaz. Gerekirse güvenli manuel restore akışı:

1. `spornerede` servisini durdur.
2. `spornerede-pocketbase` servisini durdur.
3. Mevcut `pb_data` ve `pb_public` için güvenlik kopyası al.
4. İndirilen arşivi aç.
5. `pb_data` ve `pb_public` dizinlerini geri koy.
6. PocketBase ve uygulamayı başlat.
7. `npm run smoke:check` veya `/api/health?deep=1` ile doğrula.

## Mail Canlı Test Akışı

Canlı SMTP değerleri `/opt/spornerede/.env` içine girildi:

```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=<Brevo SMTP login>
SMTP_PASS=<Brevo SMTP key>
MAIL_FROM=no-reply@spornerede.net
MAIL_TO=info@spornerede.net
MAIL_QUEUE_TOKEN=<strong-token>
```

DNS tarafında kontrol:

- SPF
- DKIM
- DMARC
- SMTP provider gerektiriyorsa reverse DNS veya domain doğrulama

Test sırası:

1. `/api/health?deep=1` sonucu SMTP için `configured=true` ve bağlantı başarılı olmalı. Tamamlandı.
2. Mail queue endpoint'i token ile tetiklenir. Tamamlandı: `processed:1`, `sent:1`, `failed:0`.
3. Başvuru formu gönderilir, kurucu maili alınır.
4. `/panel/sifremi-unuttum` ile şifre sıfırlama maili denenir.

### Yeni komutlar (lokal/CI)

- `npm run release:gate`:
  - Zorunlu dosyalar var mı?
  - `DEPLOY_SSH` ve `SITE_URL` env değerleri tanımlı mı?
- `npm run smoke:check`:
  - `SITE_URL` hedefinde `/`, `/ara`, `/basvuru`, `/api/health?deep=1` 2xx/3xx dönüyor mu?
  - Hata durumunda exit code 1 ile deploy pipeline'ı fail eder

### Ilk aktivasyon notu

- Ilk kurulumda (sunucuya bir kez) `deploy/remote-doctor.sh` ile systemd/nginx tabaninin hazir oldugundan emin olun.
- Deploy sonrasi saglik kontrolunu lokalden manuel calistirin (`/`, `/ara`, `/basvuru`, `/api/health?deep=1`).

## Repo Icindeki Deploy Scriptleri (Onerilen)

Bu repo artik `dist/` klasorunu nginx `root` altina kopyalamayi varsaymaz (SSR icin yetersiz kalir).

- `deploy/spornerede.service.example`: systemd unit ornegi
- `deploy.sh`: lokal build + rsync release + `current` symlink + systemd restart
- `rollback.sh`: son basarili release'e don (`releases/.previous`)

### Ilk Kurulum (sunucu)

1. Node 22+ kurulu olsun
2. Klasorler:
  - `/opt/spornerede/releases`
  - `/opt/spornerede/current` (symlink)
3. `/opt/spornerede/.env` olustur (ornek alanlar unit dosyasinda)
4. systemd:
  - `deploy/spornerede.service.example` dosyasini `/etc/systemd/system/spornerede.service` olarak kopyala
  - `systemctl daemon-reload`
  - `systemctl enable --now spornerede`
5. Nginx reverse proxy (Node `PORT` ile uyumlu olmali):
  - `location /` -> `http://127.0.0.1:3000` (veya sectiginiz port)
  - Repo icinde hizli yol: `bash deploy.sh --ssh root@IP --update-nginx`
    - Mevcut vhost'ta SSL satirlari varsa bunlari mumkun oldugunca korur, statik `root` vhost'unu devre disi birakir

### Gunluk Deploy (gelistirici makinesi)

Ortam degiskenleri:

- `DEPLOY_SSH` zorunlu (ornek: `root@1.2.3.4`)
- `REMOTE_BASE` opsiyonel (varsayilan: `/opt/spornerede`)
- `SYSTEMD_UNIT` opsiyonel (varsayilan: `spornerede`)
- `SSH_PASSWORD` opsiyonel (sohbete yapistirmayin; sadece lokal terminalde)

Komutlar:

```bash
chmod +x deploy.sh rollback.sh
bash deploy.sh --ssh root@SUNUCU_IP
```

Ilk kurulum / "coming soon" hala gorunuyorsa:

```bash
bash deploy.sh --ssh root@SUNUCU_IP --update-nginx
```

Alternatif:

```bash
npm run deploy:remote
```

Kalici (lokal) ayar dosyasi:

- Repo kokunde `.env.deploy` olusturun (`.gitignore`'da) ve icine `DEPLOY_SSH=...` yazin.

PowerShell notu:

- `export` yoktur. Ya `--ssh` kullanin ya da:
  - `$env:DEPLOY_SSH="root@IP"; bash deploy.sh`

### Rollback

```bash
export DEPLOY_SSH="root@SUNUCU_IP"
bash rollback.sh
```

Alternatif:

```bash
npm run rollback:remote
```

## Hızlı Doğrulama Checklist

- 200 response: `/`, `/ara`, `/basvuru`
- `/api/health?deep=1` sonucu `status=ok` veya aksiyon üretilecek şekilde gözden geçirildi
- Form submit sonrası API hata vermiyor
- Header ve mobil menü çalışıyor
- SSL ve domain yönlendirmesi normal

## Self-host Felsefesi (Operasyon Kararı)

- Uygulama ve veritabanı self-host (Node + PocketBase + Nginx + systemd)
- Kritik deploy akışları repo scriptleriyle yönetilir (elle SSH komutuna bağımlılığı azalt)
- Dış bağımlılık minimizasyonu hedeflenir; zorunlu dış servisler (ör. SMTP relay) tek sorumlulukla izole edilir
- Her deploy sonrası ölçülebilir sağlık sinyali (`release:gate` + `smoke:check` + `api/health`) zorunlu kabul edilir

## Rollback Planı

1. `bash rollback.sh` (script metadata ile)
2. Sorun devam ediyorsa: son stabil commit'e donup `bash deploy.sh`
3. Sağlık kontrolünü tekrar çalıştır
4. Olay notu bırak (sorun + çözüm)

## Olay Notu Formatı

- Tarih/Saat:
- Hata Özeti:
- Etkilenen Alan:
- Uygulanan Geri Dönüş:
- Kalıcı Düzeltme Aksiyonu:

