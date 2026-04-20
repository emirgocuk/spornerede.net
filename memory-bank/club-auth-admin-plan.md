# SporNerede.net — Kulüp paneli, kimlik doğrulama ve yönetim planı

Bu belge; kulüp üyesi paneli, yönetici onayı, referans veriler (branş / il / ilçe) ve zenginleştirilmiş başvuru (belge + ödeme dekontu) için **ürün + teknik** çerçeveyi tanımlar. Uygulama aşamaları bilinçli şekilde parçalanır; ilk sprintte “çalışan iskelet”, sonraki sprintlerde derinleşme hedeflenir.

## 1. Rol ve yüzey alanları


| Rol                | Yüzey                                                      | Amaç                                                             |
| ------------------ | ---------------------------------------------------------- | ---------------------------------------------------------------- |
| Ziyaretçi          | Genel site (`/`, `/ara`, …)                                | Arama, kulüp keşfi                                               |
| Kulüp temsilcisi   | **Kulüp paneli** (`/panel/`*)                              | Giriş, profil, kurs/ilan yönetimi (aşamalı)                      |
| Operasyon / kurucu | **Yönetim** (`/admin` — mevcut iskelet; ileride tam shell) | Başvuru inceleme, onay/red, kulüp metin düzenleme, referans veri |


**URL kararı (mevcut kod ile uyum):** Yönetim kökü `/admin`. Kulüp tarafı `/panel` altında toplanır (ör. `/panel/giris`). İleride “iç içe mobil menü” ve masaüstü avatar dropdown aynı route setine bağlanır.

## 2. Kulüp temsilcisi deneyimi (UX)

### 2.1 Oturum kapalı

- Header’da **“Üye girişi”** (`/panel/giris`) — CTA’nın solunda, sağ blokta hizalı.
- Mobil: aynı blokta kompakt link + hamburger menü içinde tekrar (parmak dostu).

### 2.2 Oturum açık (hedef)

- **Masaüstü:** “Üye girişi” metni yerine **avatar / kulüp kısaltması** ile küçük yuvarlak düğme; tıklanınca **dropdown**: örn. “Profil”, “Kurs ekle / program”, “Çıkış” (içerik sprint bazlı genişler).
- **Mobil:** Hamburger içinde **iç içe (accordion) blok**: “Hesabım” açılınca alt maddeler (aynı route’lar).

### 2.3 Panel sayfaları (tasarım sırası — sonraki iş)

1. `/panel/giris` — e-posta + şifre (veya magic link; teknik bölümde seçim).
2. `/panel` veya `/panel/ozet` — kulüp özeti, başvuru/onay durumu.
3. `/panel/profil` — iletişim, adres, açıklama metinleri.
4. `/panel/kurslar` (veya program) — listeleme + ekleme/düzenleme.

İlk canlıda sadece giriş + boş/placeholder alt sayfalar kabul edilebilir; asıl değer **onaylı kulüp + DB** ile gelir.

## 3. Yönetim (admin) deneyimi

### 3.1 Düzen önerisi (“sağda liste”)

- **Sol / merkez:** Seçili öğenin detayı (başvuru formu alanları, yüklenen belgeler, önizleme, not alanı).
- **Sağ sütun:** Filtrelenebilir **kuyruk listesi** (bekleyen başvurular, tarih, kulüp adı özeti). Liste öğesine tıklanınca sol tarafta detay.
- **Genişleme:** Aynı sağ şerit veya üst sekmelerle “Referans veriler”, “Kulüp listesi”, “Ayarlar” modülleri eklenir; shell bir kez kurulur, içerik modül modül bağlanır.

Mevcut: `/admin` özet kartları + `GET/POST /api/admin/applications` (token). Sonraki adım: bu API’yi arayüze bağlayıp **liste + detay + belge görüntüleme** eklemek.

### 3.2 Onay akışı (iş kuralı)

1. Kulüp `/basvuru` ile başvurur (form + dosyalar).
2. Yönetici inceler; gerekirse “ek bilgi” durumu (opsiyonel, sonraki faz).
3. **Onay** → `clubs` (veya mevcut `kulupler`) kaydı oluşur veya aktifleşir; başvuru `application_id` ile kulübe bağlanır.
4. **Red** → gerekçe (opsiyonel) + e-posta bildirimi.
5. Onay sonrası kulüp temsilcisine **panel hesabı** bağlanır (davet şifresi veya kayıt linki — ayrıntı Faz 3.2).

## 4. Başvuru sistemi: form + belge + dekont

### 4.1 Alanlar (MVP genişlemesi)

- Mevcut metin alanları korunur.
- Ek: vergi / ticari unvan (opsiyonel), fatura bilgisi ihtiyacına göre.
- **Dosya türleri:** `application_documents` benzeri tablo veya genel `attachments` + `kind` enum: `dekont`, `kimlik`, `sozlesme`, `diger`.
- Depolama: sunucu diski veya S3 uyumlu object storage; üretimde **virus taraması** ve boyut limiti (örn. 5–10 MB) `security-privacy.md` ile uyumlu.

### 4.2 Ödeme modeli (MVP)

- “Ödeme alındı” kanıtı **dekont yükleme** ile yönetilir; kart entegrasyonu sonraya bırakılır.
- Onay, hem içerik hem dekont kontrolünü kapsayacak şekilde tek veya iki aşamalı iş akışı (basit başlangıç: tek onay).

## 5. Referans veri: branş, şehir, ilçe

- `branches`, `cities`, `districts` (bkz. `db-schema-plan.md`) yönetimden **CRUD veya toplu içe aktarma** (CSV).
- Seed ile ilk veri; güncellemeler admin’den.
- Public `/ara` sorguları bu tablolara bağlandığında mock kalkar.

## 6. Kulüp sayfası ve metin düzenleme

- Her kulübün public URL’si (örn. `/kulupler/[slug]`) yönetimde listelenir.
- Yönetici “kulüp editörü” ile **açıklama, iletişim, branş etiketleri** düzenler (yayın öncesi önizleme iyi olur).
- İleride aynı alanlar kulüp panelinden de düzenlenebilir; tek kaynak DB.

## 7. Teknik mimari önerileri

### 7.1 Kimlik doğrulama

- PostgreSQL üzerinde **oturum tabanlı** yaklaşım (httpOnly cookie) + şifre hash (örn. Argon2id veya bcrypt).
- Kütüphane seçimi sprint başında netleştirilir: **Better Auth**, **Auth.js** veya hafif özel session + Drizzle — önemli olan: SSR (Astro) ile uyum ve rol kontrolü.

### 7.2 Yetkilendirme

- `users.role`: en azından `admin`, `club`.
- Kulüp–kullanıcı bağları: `club_memberships` (çoklu kullanıcı / kulüp için hazırlık).

### 7.3 API güvenliği

- Admin: token yerine **oturum + rol** (üretimde token sadece otomasyon için kısıtlı kalabilir).
- Panel: sadece ilgili `club_id` scope’unda sorgu.

### 7.4 Dosya yükleme

- `POST /api/.../upload` multipart → object storage key DB’de; indirme **imzalı URL** veya yetkili proxy.

## 8. Uygulama fazları (özet)


| Faz    | İçerik                                                                                            |
| ------ | ------------------------------------------------------------------------------------------------- |
| **3A** | Şema: `users`, `sessions`, `application_documents`, başvuru durumları; dosya yükleme API iskeleti |
| **3B** | `/panel/giris` + oturum; header’da oturum durumuna göre UI (dropdown / mobil accordion)           |
| **3C** | `/admin` shell: sağ liste + başvuru detayı + onay/red + onayda kulüp oluşturma                    |
| **3D** | Referans veri yönetimi + kulüp metin editörü                                                      |
| **3E** | Kulüp paneli: profil + kurs/program CRUD                                                          |


## 9. İzleme ve dokümanlar

- Şema ayrıntıları: `db-schema-plan.md` (bu planla senkron güncellenir).
- Güvenlik / KVKK: `security-privacy.md` (dosya saklama, erişim logu).
- Bu dosya: **ürün kararları ve ekran akışı** için ana referans.