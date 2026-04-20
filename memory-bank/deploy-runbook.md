# SporNerede.net — Deploy Runbook (Basit Sürüm)

## Amaç

Deploy sürecini tekrarlanabilir ve düşük riskli hale getirmek.

## Deploy Öncesi Kontrol

- `npm ci` ve `npm run build` lokal başarılı
- `npm run release:gate` başarılı (deploy zorunlu ön kontrol)
- Gerekli env değerleri hazır: `SMTP_*`, `MAIL_TO`, `SITE_URL`
- Son değişikliklerde kritik sayfalar test edildi: `/`, `/ara`, `/basvuru`
- `robots.txt` ve sitemap erişilebilir durumda
- Windows: `npm run dev` acikken `npm ci` cogu zaman `EPERM` verir; deploy oncesi dev server'i durdurun

## Standart Deploy Akışı

1. Sunucuda güncel kodu al
2. Bağımlılıkları kur (`npm ci`)
3. Build al (`npm run build`)
4. Uygulamayı yeniden başlat (process manager ile)
5. Sağlık kontrolü yap:
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
- Deploy sadece gelistirici makinesinden SSH uzerinden calisir (`deploy.sh`)

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

- Uygulama ve veritabanı self-host (Node + PostgreSQL + Nginx + systemd)
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

