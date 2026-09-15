# SporNerede.net — Güvenlik Taraması ve İyileştirme Planı (Security Audit & Remediation Plan)

**Tarih:** 15 Eylül 2026  
**Kapsam:** `spornerede.net` Web Uygulaması ve Sunucu Entegrasyonu  
**Durum:** Planlama & İnceleme Tamamlandı (Uygulama Bekliyor)

---

## 1. Tarama Yöntemi (Audit Methodology)

Bu güvenlik incelemesi, harici üçüncü taraf tarayıcılara ihtiyaç duyulmaksızın doğrudan kaynak kodu seviyesinde **Statik Kod Analizi (SAST)**, **Veri Akış İncelemesi (Taint/Data Flow Analysis)** ve **Mimari Tehdit Modellemesi (Threat Modeling)** yöntemleriyle gerçekleştirilmiştir.

### Kapsanan Katmanlar ve Dosyalar:
1. **Veritabanı & Yetkilendirme Katmanı:**
   - `src/db/client.ts` (PocketBase superuser singleton ve istemci izolasyonu)
   - `src/lib/repositories/auth.ts` (Kullanıcı, oturum ve şifre sıfırlama akışları)
   - `src/lib/adminAuth.ts` (Yönetici token doğrulaması ve zamanlama saldırısı koruması)
   - `src/lib/auth/guards.ts` & `src/lib/auth/session.ts` (Oturum çerezleri ve rol bazlı erişim denetimi)
2. **Ağ & Hız Sınırlama (Rate Limiting) Katmanı:**
   - `src/lib/security/rateLimiter.ts` (IP tespiti, sliding window rate limit ve bellek temizliği)
   - `src/middleware.ts` (CSRF koruması, cache izolasyonu ve güvenlik başlıkları)
   - `remote_nginx.conf` (Ters vekil sunucu ayarları, Real-IP yapılandırması)
3. **Genel Formlar & Dosya Yükleme Katmanı:**
   - `src/pages/api/basvuru.ts` (Kulüp başvuru formu ve çoklu belge yükleme)
   - `src/pages/api/contact.ts` (İletişim mesajları endpoint'i)
   - `src/lib/security/fileValidation.ts` (Büyü bayt / magic bytes dosya imzası doğrulama)
4. **E-Posta & Bildirim Katmanı:**
   - `src/lib/mail/templates.ts` (HTML e-posta şablonları ve dinamik veri yerleşimi)
   - `src/lib/mail/service.ts` (Kuyruk yönetimi ve gönderim servisi)
5. **İstemci Arayüzü & XSS Riskleri:**
   - `src/pages/haberler/[slug].astro` (Dinamik HTML render'ı)
   - `src/pages/ilanlar/[id].astro` (Zengin metin / AST parser kontrolü)
   - `src/pages/merkez.astro` (Admin paneli veri gösterimi ve DOM manipülasyonu)

---

## 2. Mevcut Güçlü Yönler (Strong Defenses in Place)

* **Timing-Attack Koruması:** `src/lib/adminAuth.ts` içerisinde admin token karşılaştırması `crypto.timingSafeEqual` ile sabit sürede yapılarak yan kanal (side-channel) saldırıları engellenmiş.
* **Güvenli Oturum Çerezleri:** `spornerede_session` çerezi `HttpOnly`, `SameSite=Lax` ve üretim ortamında `Secure` olarak işaretlenmiş; oturum token'ları veritabanında düz metin yerine SHA-256 özeti olarak tutuluyor.
* **IDOR (Yetkisiz Nesne Erişimi) Engeli:** Kulüp paneli API'lerinde (`src/lib/repositories/panelPrograms.ts`) güncelleme ve silme sorguları `kulupLegacyId = ${clubId}` filtresiyle doğrulanıyor.
* **Büyü Bayt (Magic Bytes) Doğrulaması:** Dosya yüklemelerinde (`fileValidation.ts`) sadece uzantıya veya tarayıcının gönderdiği MIME tipine güvenilmiyor; JPEG, PNG, WEBP, PDF ve ZIP gerçek dosya başlık baytları kontrol ediliyor.
* **Admin Paneli Veri İzolasyonu:** `src/pages/merkez.astro` içerisinde dinamik DOM güncellemelerinde `escapeHtml()` fonksiyonu tutarlı şekilde kullanılmış.
* **Depo Temizliği:** `.gitignore` kuralları eksiksiz; `.env`, kimlik dosyaları, veritabanı dosyaları ve yedekler repoya sızmamış.

---

## 3. Bulunan Sorunlar (Identified Vulnerabilities & Risks)

### [BULGU 1 - ORTA / YÜKSEK] IP Sahteciliği ile Rate Limit Atlatma (IP Spoofing via CF-Connecting-IP)
* **İlgili Dosya:** `src/lib/security/rateLimiter.ts` (Satır 35-43)
* **Açıklama:**
  `getClientIp()` fonksiyonu, istemci IP'sini tespit ederken ilk sırada `cf-connecting-ip` başlığına bakmaktadır:
  ```typescript
  export function getClientIp(request: Request): string {
    const cfIp = request.headers.get('cf-connecting-ip');
    if (cfIp) return cfIp.trim();
    const xReal = request.headers.get('x-real-ip');
    ...
  }
  ```
* **Tehdit Senaryosu:**
  Sunucu IP adresi (`45.155.19.82`) doğrudan internete açıktır ve doğrudan gelen HTTP/HTTPS isteklerini kabul etmektedir. Bir saldırgan, Cloudflare üzerinden geçmeden doğrudan sunucuya bağlanıp her istekte rastgele sahte bir başlık (`CF-Connecting-IP: 1.2.3.X`) gönderdiğinde, Node.js bu sahte IP'yi gerçek sanır.
* **Etki:** `/api/panel/login` ve `/api/contact` üzerindeki brute-force koruması ve hız sınırlaması tamamen atlatılabilir.

---

### [BULGU 2 - ORTA] `/api/basvuru` Endpoint'inde Hız Limiti ve Bot Koruması Bulunmaması
* **İlgili Dosya:** `src/pages/api/basvuru.ts` (Satır 108) & `src/middleware.ts` (Satır 68)
* **Açıklama:**
  Kod tabanında `// Rate limit engeli kaldırıldı...` açıklamasıyla bu endpoint üzerindeki tüm hız kontrolleri kaldırılmış ve middleware içerisinde CSRF denetiminden istisna tutulmuştur.
* **Tehdit Senaryosu:**
  Otomatik bir script, `/api/basvuru` endpoint'ine dakikada yüzlerce POST isteği atabilir. Her başarılı/başarısız istekte:
  1. Sunucu diskine (`uploads/applications/`) 10 MB'a kadar dosya yazılır.
  2. PocketBase üzerinde başvuru ve belge kayıtları açılır.
  3. Yöneticiye anında e-posta göndermek üzere `enqueueMail` ve `processMailQueue` tetiklenir.
* **Etki:** Sunucu disk alanının tükenmesi (Disk Exhaustion DoS), e-posta sağlayıcı kotasının (Resend/SMTP) tükenmesi ve yönetici gelen kutusunun spam ile kilitlenmesi.

---

### [BULGU 3 - ORTA] Yönetici Bildirim E-Postalarında HTML Enjeksiyonu (HTML / Email Injection)
* **İlgili Dosya:** `src/lib/mail/templates.ts` (`buildApplicationNotificationMail` fonksiyonu)
* **Açıklama:**
  Kullanıcı tarafından başvuru formuna girilen `kulupad`, `il`, `ilce`, `yetkili`, `telefon` ve `aciklama` alanları, HTML e-posta şablonuna kaçış işlemi (`escapeHtml`) yapılmadan doğrudan `${input.kulupad}` şeklinde yerleştirilmektedir.
* **Tehdit Senaryosu:**
  Saldırgan başvuru formundaki kulüp adına veya yetkili alanına zararlı HTML kodları (örneğin sahte giriş ekranı bağlantısı, phishing linki veya e-posta istemcilerini bozan biçimlendirmeler) yerleştirebilir.
* **Etki:** Yöneticiye ulaşan e-postada görsel bozulma, phishing (oltalama) linki enjeksiyonu ve yönetici güvenliğinin tehlikeye girmesi.

---

### [BULGU 4 - ORTA] Kulüp Kullanıcısı Tanımlarken Sessiz Şifre Ezilmesi (Silent Password Overwrite)
* **İlgili Dosya:** `src/lib/repositories/auth.ts` (Satır 218-240)
* **Açıklama:**
  `ensureClubUserForClub()` fonksiyonunda, eğer parametre olarak verilen e-posta sistemde zaten varsa:
  ```typescript
  } else {
    await updateUserPassword(user.id, input.passwordHash, { forcePasswordChange: true });
  }
  ```
* **Tehdit Senaryosu:**
  Sistemde zaten kayıtlı olan (örneğin başka bir kulübün yöneticisi veya personeli olan) bir e-posta adresi için yeni bir kulüp oluşturulduğunda, kullanıcının mevcut şifresi hiçbir uyarı verilmeden doğrudan yeni geçici şifre ile ezilmektedir.
* **Etki:** Kullanıcının mevcut erişimini kaybetmesi, veri tutarsızlığı ve hesap karışıklığı.

---

### [BULGU 5 - DÜŞÜK / ORTA] Haber Detayında Filtrelenmemiş HTML Gösterimi (Stored XSS Riski)
* **İlgili Dosya:** `src/pages/haberler/[slug].astro` (Satır 73)
* **Açıklama:**
  Haber detay sayfasında `<div set:html={haber.ozet} />` ile haber özeti doğrudan DOM'a yazılmaktadır. `src/lib/repositories/news.ts` içerisindeki `stripHtml` fonksiyonu ise basit bir regex (`/<[^>]*>/g`) kullanmaktadır.
* **Tehdit Senaryosu:**
  Otomatik bot/içerik motoru (content-engine) veya dış haber kaynaklarından gelen içeriklerde gizlenmiş zararlı HTML etiketleri (`<img src=x onerror=...>`, `<svg onload=...>`) bulunursa, bu sayfa ziyaret edildiğinde istemci tarayıcısında JavaScript çalıştırabilir.
* **Etki:** XSS (Siteler Arası Betik Çalıştırma).

---

### [BULGU 6 - DÜŞÜK] Eksik CSP (Content-Security-Policy) Başlığı
* **İlgili Dosya:** `src/middleware.ts`
* **Açıklama:**
  Middleware içerisinde HSTS, X-Frame-Options, X-Content-Type-Options gibi başlıklar başarıyla yerleştirilmiş olsa da `Content-Security-Policy` başlığı yer almamaktadır (dosya başında TODO olarak bırakılmıştır).
* **Etki:** Olası bir XSS veya üçüncü parti kütüphane sızıntısında tarayıcının harici saldırgan sunucularına veri sızdırması engellenemez.

---

## 4. Çözüm Önerileri ve Düzeltme Planı (Remediation Plan)

### FAZ 1: Acil Düzeltmeler (Yüksek Öncelik - Anında Uygulanabilir)

#### Adım 1.1: `rateLimiter.ts` İçerisinde Güvenilir IP Sıralaması
* **Yapılacak:** Nginx tarafından güvenle ayarlanan `x-real-ip` başlığına öncelik verilecek; `cf-connecting-ip` yalnızca Nginx veya Cloudflare doğrulamasından geçmişse kabul edilecek.
* **Hedef:** IP spoofing ile rate limit atlatılmasının engellenmesi.

#### Adım 1.2: E-Posta Şablonlarına HTML Kaçışı Eklenmesi
* **Yapılacak:** `src/lib/mail/templates.ts` içine yardımcı bir `escapeHtml` fonksiyonu eklenip `buildApplicationNotificationMail` içerisindeki tüm dinamik kullanıcı alanları (`kulupad`, `yetkili`, `aciklama` vb.) temizlenecek.
* **Hedef:** E-posta HTML enjeksiyonunun önlenmesi.

#### Adım 1.3: Başvuru Formuna Esnek Rate Limit ve Honeypot Alanı
* **Yapılacak:**
  1. Başvuru formuna görünmez bir sahte alan (honeypot `website_url_check`) eklenecek; botlar bu alanı doldurduğunda istek sessizce reddedilecek.
  2. Aynı IP adresinden 10 dakikada en fazla 5 başvuruya izin verecek esnek bir limit eklenecek (normal kullanıcıyı asla engellemez, bot saldırılarını keser).
* **Hedef:** DoS, disk dolması ve e-posta kotası tükenmesinin engellenmesi.

---

### FAZ 2: Mantıksal ve Arayüz İyileştirmeleri (Orta Öncelik)

#### Adım 2.1: `ensureClubUserForClub` Şifre Ezme Mantığının Düzeltilmesi
* **Yapılacak:** Kullanıcı sistemde zaten mevcutsa şifresi doğrudan ezilmeyecek; yalnızca mevcut kullanıcıya yeni kulüp üyeliği (`assignUserToClub`) bağlanacak.
* **Hedef:** Hesap güvenliği ve veri bütünlüğünün korunması.

#### Adım 2.2: Haber Özetleri İçin Güvenli HTML Temizleme
* **Yapılacak:** `haberler/[slug].astro` sayfasında ham HTML basılması yerine izin verilen temel etiketleri (p, strong, em, br) tutan güvenli bir temizleme adımı veya AST bazlı gösterim uygulanacak.
* **Hedef:** Stored XSS riskinin tamamen ortadan kaldırılması.

#### Adım 2.3: Middleware CSP Başlığı Entegrasyonu
* **Yapılacak:** `src/middleware.ts` içine `Content-Security-Policy` eklenerek `script-src 'self' 'unsafe-inline' https://www.googletagmanager.com` gibi yalnızca gerekli kaynaklara izin verilecek.
* **Hedef:** İstemci tarafı savunma derinliği (Defense-in-depth).

---

## 5. Doğrulama ve Test Adımları (Verification)

1. **IP Tespiti Testi:** Doğrudan sahte `CF-Connecting-IP` başlığı taşıyan curl isteği atıldığında gerçek IP'nin loglandığı ve rate limit'in aşılamadığı teyit edilecek.
2. **E-Posta Enjeksiyon Testi:** `<script>` veya `<b>` etiketi içeren kulüp adı gönderildiğinde gelen e-postada metnin düz kaçışlı metin olarak çıktığı doğrulanacak.
3. **Bot / Honeypot Testi:** Honeypot alanı dolu isteklerin disk veya e-posta servisine ulaşmadan 400 ile kesildiği test edilecek.
