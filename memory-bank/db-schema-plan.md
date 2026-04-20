# SporNerede.net — DB Schema Plan (Basit Sürüm)

## Amaç

Mock veriden PostgreSQL + Drizzle yapısına geçiş için minimum netlik sağlamak.

## Kapsam (MVP)

- Kulüplerin listelenmesi ve filtrelenmesi
- Branş-kulüp ilişkisi
- İl/ilçe bazlı arama
- Başvuru kayıtlarının saklanması (opsiyonel ama önerilir)

Kulüp paneli, yönetim onayı ve dosya ekleri için ayrıntılı akış: `**club-auth-admin-plan.md**`. Bu dosyadaki tablo isimleri uygulama koduyla (`kulupler`, mevcut başvuru repo’su) hizalanarak migration’larda evrilecek.

## Tablolar

### `cities`

- `id` (pk)
- `name` (unique) — örn. Ankara
- `slug` (unique) — örn. ankara

### `districts`

- `id` (pk)
- `city_id` (fk -> cities.id)
- `name`
- `slug`
- Unique: (`city_id`, `slug`)

### `branches`

- `id` (pk)
- `name` (unique) — örn. Futbol
- `slug` (unique) — örn. futbol
- `category` (nullable) — takım, bireysel vb.

### `clubs`

- `id` (pk, uuid önerilir)
- `name`
- `slug` (unique)
- `city_id` (fk -> cities.id)
- `district_id` (fk -> districts.id)
- `address` (text)
- `phone` (nullable)
- `email` (nullable)
- `description` (text, nullable)
- `price_min` (nullable)
- `price_max` (nullable)
- `trial_lesson` (boolean, default false)
- `is_active` (boolean, default true)
- `created_at`, `updated_at`

### `club_branches` (N:N)

- `club_id` (fk -> clubs.id)
- `branch_id` (fk -> branches.id)
- Composite PK: (`club_id`, `branch_id`)

### `applications` (önerilen — genişletilmiş)

- `id` (pk)
- `club_name`
- `branch_text` veya `branch_id` (fk, geçişte ikisi birlikte olabilir)
- `district_text` / `city_id` / `district_id` (normalize edildikçe fk)
- `phone`, `email`
- `message` (nullable)
- `status`: `pending` | `approved` | `rejected` (+ ileride `needs_info`)
- `created_at`, `updated_at`
- `reviewed_at`, `reviewed_by_user_id` (nullable, fk -> users)
- Onay sonrası: `result_club_id` (nullable, fk -> kulüpler/clubs)

### `application_documents` (yeni — dekont ve belgeler)

- `id` (pk)
- `application_id` (fk)
- `kind`: `dekont` | `kimlik` | `sozlesme` | `diger`
- `storage_key` (object storage veya disk yolu)
- `original_filename`, `mime_type`, `byte_size`
- `created_at`

### `users` (kulüp paneli + yönetim)

- `id` (pk, uuid)
- `email` (unique)
- `password_hash`
- `role`: `admin` | `club` (genişletilebilir)
- `created_at`, `updated_at`

### `sessions` (veya seçilen auth kütüphanesinin tablosu)

- `id`, `user_id` (fk), `expires_at`, token hash alanları

### `club_memberships`

- `user_id` (fk), `club_id` (fk), `role` (`owner` | `staff`)
- Composite unique: (`user_id`, `club_id`)

## İndeksler (MVP)

- `clubs(city_id, district_id)`
- `clubs(is_active)`
- `clubs(price_min, price_max)` (filtre ihtiyacı artarsa)
- `club_branches(branch_id)`
- `branches(slug)`, `districts(slug)`, `cities(slug)`

## URL ve Slug Standardı

- Küçük harf + tire: `cankaya`, `masa-tenisi`
- Türkçe karakter dönüşümü uygulanır (`ç -> c`, `ş -> s`, vb.)
- Aynı isimde çakışma olursa sonuna kısa ek: `-2`

## Geçiş Sırası (Faz 2)

1. Drizzle şema dosyalarını oluştur
2. Migration üret ve PostgreSQL'e uygula
3. Mock veriyi seed script ile taşı
4. `/ara` sorgularını DB katmanına bağla
5. Mock kaynaklarını kaldır

## Geçiş Sırası (Faz 3 — panel ve yönetim)

1. `users`, `sessions`, `club_memberships` + başvuru genişlemesi ve `application_documents`
2. Başvuru formu: multipart yükleme + güvenli depolama
3. `/admin` arayüzü: sağ kuyruk listesi + detay + onay/red + onayda kulüp kaydı
4. `/panel/giris` ve oturum; header’da oturuma göre avatar + dropdown / mobil accordion
5. Referans veri CRUD (admin) ve kulüp metin düzenleme