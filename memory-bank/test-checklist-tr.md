# SporNerede.net — Test Checklist (TR)

Bu dosya, akşam toplu testlerde hızlı ilerlemek için hazırlanmıştır.

## 1) Deploy ve Genel Sağlık

- Sunucuda `spornerede-autoupdate.timer` aktif mi?
- `spornerede-autoupdate.service` son çalışması hatasız mı? (`journalctl`)
- GitHub'a yeni commit sonrası sunucu `git pull + build + release + restart` döngüsü tamamlandı mı?
- Deploy sonrası `release:gate` adımı (manuel) geçti mi?
- Deploy sonrası `smoke:check` adımı (manuel) geçti mi?
- Demo test ortamı için `npm run demo:seed` çalıştırıldı mı?
- `https://spornerede.net/api/health` yanıtı `status: ok` mu?
- `https://spornerede.net/api/health?deep=1` yanıtı beklenen durumda mı (`ok` veya nedeni net `degraded`)?

## 2) Public Sayfalar

- `/` açılıyor ve temel bloklar yükleniyor mu?
- `/ara` açılıyor, filtre ve liste görsel olarak stabil mi?
- `/ara` kartlarında program verisi olan kulüplerde "program özeti" görünüyor mu?
- `/kulupler/[id]` detayında aktif program listesi düzgün görünüyor mu?
- `/basvuru` form alanları düzgün çalışıyor mu?

## 3) Başvuru Akışı

- Zorunlu alanlar boşken doğru hata dönüyor mu?
- Geçerli veriyle başvuru başarılı mı (`/basvuru?success=1`)?
- Mail bildirimi gidiyor mu?
- Belge yüklenince sunucuda dosya kaydı oluşuyor mu?
- Belge metaverisi DB'ye yazılıyor mu (`basvuru_belgeleri`)?

## 4) Panel Auth Akışı

- `/panel/giris` formu görüntüleniyor mu?
- Geçersiz girişte doğru hata mesajı çıkıyor mu?
- Geçerli kullanıcıyla giriş sonrası `/panel` açılıyor mu?
- Header'daki "Üye girişi" linki oturum açıkken "Panelim"e dönüyor mu?
- `/api/panel/session` oturum açıkken `authenticated: true` dönüyor mu?
- Çıkış sonrası `/panel` erişimi tekrar login'e düşüyor mu?
- `/panel/profil` açılıyor ve kulüp verisi yükleniyor mu?
- Profil kaydetme sonrası alanlar kalıcı güncelleniyor mu?
- `/panel/kurslar` açılıyor ve mevcut programlar listeleniyor mu?
- Program ekleme/düzenleme/silme akışları çalışıyor mu?
- Program aktif/pasif bilgisi listede doğru yansıyor mu?
- Geçici şifre ile girişte kullanıcı `/panel/sifre-degistir` sayfasına yönleniyor mu?
- Şifre değiştirme sonrası panel akışına normal erişim açılıyor mu?

## 5) Admin Akışı

- `/admin` sayfası açılıyor mu?
- Token ile başvuru listesi yükleniyor mu?
- Liste arama kutusu çalışıyor mu? (ad/il/ilçe)
- Durum filtresi doğru çalışıyor mu? (`pending/approved/rejected`)
- Liste öğesinden detay ekranı açılıyor mu?
- Durum güncelleme (`pending/approved/rejected`) çalışıyor mu?
- Admin notu kaydetme kalıcı mı? (yenileme sonrası not korunuyor mu?)
- Belge listesi admin detayında görünüyor mu?
- Admin’den belge metaverisi ekleme çalışıyor mu?
- Admin detayındaki "Belgeyi indir" linki gerçek dosyayı indiriyor mu?
- "Sorumlu Admin E-posta" alanı kaydedilip detay yeniden açıldığında korunuyor mu?
- "İşlem Geçmişi" listesi status/not/assignment değişimlerini gösteriyor mu?
- Admin onboarding bölümünden kulüp kullanıcı hesabı oluşturma/güncelleme çalışıyor mu?
- Oluşturulan kulüp kullanıcısı panel giriş yapabiliyor mu?
- Provisioning sonrası bilgilendirme maili gidiyor mu? (veya `mailWarning` beklenen şekilde dönüyor mu?)

## 6) Veritabanı Kontrolleri

- Migration’lar tam uygulandı mı (`db:migrate`)?
- `kullanicilar`, `oturumlar`, `kulup_uyelik_kullanicilari`, `basvuru_belgeleri` tabloları mevcut mu?
- `user:create` ile üretilen kullanıcı login olabiliyor mu?
- `user:assign-club` ile kullanıcı kulübe bağlandıktan sonra panel profiline erişebiliyor mu?

## 7) Regresyon Hızlı Kontrol

- Header/mobil menü bozulmadı mı?
- `/api/admin/applications` mevcut davranışı koruyor mu?
- Sunucuda service restart sonrası 5xx artışı yok mu?

## 8) Test Sonu Notları

- Bulunan hatalar issue/task olarak yazıldı mı?
- Kritik hata varsa rollback kararı net mi?
- Bir sonraki faz öncelikleri güncellendi mi (`activeContext.md`, `progress.md`)?