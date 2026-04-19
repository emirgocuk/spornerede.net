# SporNerede.net — DB Schema Plan (Basit Sürüm)

## Amaç
Mock veriden PostgreSQL + Drizzle yapısına geçiş için minimum netlik sağlamak.

## Kapsam (MVP)
- Kulüplerin listelenmesi ve filtrelenmesi
- Branş-kulüp ilişkisi
- İl/ilçe bazlı arama
- Başvuru kayıtlarının saklanması (opsiyonel ama önerilir)

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

### `applications` (önerilen)
- `id` (pk)
- `club_name`
- `branch_text`
- `district_text`
- `phone`
- `email`
- `message` (nullable)
- `status` (default: new)
- `created_at`

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
