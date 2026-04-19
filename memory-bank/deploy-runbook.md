# SporNerede.net — Deploy Runbook (Basit Sürüm)

## Amaç
Deploy sürecini tekrarlanabilir ve düşük riskli hale getirmek.

## Deploy Öncesi Kontrol
- `npm ci` ve `npm run build` lokal başarılı
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
- Form submit sonrası API hata vermiyor
- Header ve mobil menü çalışıyor
- SSL ve domain yönlendirmesi normal

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
