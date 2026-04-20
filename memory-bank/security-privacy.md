# SporNerede.net — Security & Privacy (Mini Checklist)

## Amaç

MVP seviyesinde temel güvenlik ve KVKK uyum risklerini azaltmak.

## Form Güvenliği

- Başvuru formuna honeypot alan ekle
- Basit rate limit uygula (IP bazlı, dakikalık limit)
- Sunucu tarafı doğrulama zorunlu (client validation tek başına yeterli değil)

## Secret Yönetimi

- SMTP bilgileri sadece `.env` içinde tutulur
- `.env` kesinlikle repoya girmez
- Üretim ve geliştirme secret'ları ayrılır

## Veri Minimizasyonu

- Yalnızca gerekli alanlar toplanır
- Başvuru verisi için saklama süresi tanımlanır (ör. 12 ay)
- Gereksiz kişisel veri loglanmaz

## KVKK Temel Adımlar

- Başvuru formu yakınında kısa aydınlatma metni
- İletişim/veri sorumlusu bilgisi erişilebilir
- Silme/düzeltme talepleri için iletişim kanalı belirtilir

## Operasyonel Kontrol

- Hata loglarında e-posta/telefon maskeleme uygulanır
- Şüpheli form trafiği düzenli kontrol edilir