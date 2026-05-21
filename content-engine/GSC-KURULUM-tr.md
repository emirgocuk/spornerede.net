# Google Search Console API — Bağlama Rehberi

Mülkiyetiniz var; API için **service account** + Search Console’da **kullanıcı ekleme** gerekir.

## 1. Google Cloud projesi

1. https://console.cloud.google.com → proje seçin veya yeni proje
2. **API’ler ve Hizmetler → Kitaplık** → **Google Search Console API** → **Etkinleştir**

## 2. Service account (JSON anahtar)

1. **IAM ve Yönetici → Hizmet Hesapları → Hizmet hesabı oluştur**
2. Ad: örn. `spornerede-gsc-read`
3. Rol: minimum **Viewer** yeterli (sadece okuma)
4. **Anahtarlar → Anahtar ekle → JSON** → indirin
5. Dosyayı kopyalayın:
   ```
   content-engine/secrets/gsc-service-account.json
   ```
   (Bu klasör `.gitignore` içinde — repoya gitmez.)

## 3. Search Console’da yetki (önemli)

1. https://search.google.com/search-console
2. **spornerede.net** mülkünü seçin
3. **Ayarlar → Kullanıcılar ve izinler**
4. **Kullanıcı ekle** → JSON içindeki `client_email` (ör. `spornerede-gsc-read@....iam.gserviceaccount.com`)
5. İzin: **Tam** veya en az **Kısıtlı** (veri okuma için Tam gerekir API’de)

Service account’u eklemezseniz API `403` döner veya mülk listesi boş gelir.

### “E-posta bulunamadı” (sizin durum)

GSC arayüzü bazen **yeni service account** e-postasını kabul etmez. Bu çoğu zaman **sizin hatanız değil** — Google tarafında bilinen bir sorun.

**Deneyebilecekleriniz (isteğe bağlı):**

1. E-postayı elle yazın (kopyala-yapıştır yerine), sondaki `.com` dahil tam:
   `spornerede-gsc-read@spornerede-497019.iam.gserviceaccount.com`
2. Birkaç saat sonra tekrar deneyin (yeni hesap gecikmesi).
3. Farklı tarayıcı / masaüstü (mobil uygulama çalışmaz).

**Önerilen çözüm — OAuth (kişisel hesap):** Mülk zaten sizde; API’yi **kendi Google hesabınızla** yetkilendirin (service account eklemeye gerek yok).

#### OAuth kurulumu (5 dk)

1. Aynı GCP projesi → **API’ler ve Hizmetler → Kimlik bilgileri**
2. **OAuth istemci kimliği oluştur** → Uygulama türü: **Masaüstü uygulaması**
3. İlk kez ise **OAuth onay ekranı** → Harici → test kullanıcısı olarak **kendi Gmail’inizi** ekleyin
4. İndirilen JSON → `content-engine/secrets/gsc-oauth-client.json`
5. `content-engine/.env`:

```env
SEO_GSC_AUTH_MODE=oauth
SEO_GSC_OAUTH_CLIENT_PATH=./secrets/gsc-oauth-client.json
SEO_GSC_OAUTH_TOKEN_PATH=./secrets/gsc-oauth-token.json
SEO_GSC_SITE_URL=sc-domain:spornerede.net
```

6. Terminal:

```powershell
cd content-engine
npm run gsc:oauth
```

Tarayıcıda **Search Console mülk sahibi** Google hesabıyla giriş → izin ver.

7. `npm run gsc:check` → mülk listesi gelmeli.

## 4. Site URL formatı (`.env`)

Mülk tipinize göre **tam** eşleşmeli:

| GSC mülk tipi | `SEO_GSC_SITE_URL` örneği |
|---------------|---------------------------|
| Alan adı (önerilen) | `sc-domain:spornerede.net` |
| URL öneki | `https://spornerede.net/` (sondaki `/` önemli olabilir) |

`content-engine/.env`:

```env
SEO_GSC_SITE_URL=sc-domain:spornerede.net
SEO_GSC_SERVICE_ACCOUNT_PATH=./secrets/gsc-service-account.json
```

## 5. Test

```powershell
cd content-engine
npm run gsc:check
```

Çıktıda:
- Bağlı mülkler listelenmeli
- Test sorgusu satır sayısı > 0 (site trafik alıyorsa)

Sonra:

```powershell
npm run content-engine:keywords
npm run content-engine:gsc
```

## Sık hatalar

| Hata | Çözüm |
|------|--------|
| `403` / boş mülk listesi | Service account GSC’de yok veya “e-posta bulunamadı” → **OAuth** kullanın |
| E-posta bulunamadı | OAuth bölümü (yukarı) |
| `404 site` | `SEO_GSC_SITE_URL` değerini `gsc:check` listesinden kopyalayın |
| Path yok | `SEO_GSC_SERVICE_ACCOUNT_PATH` dosya yolu doğru mu kontrol edin |
