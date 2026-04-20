# SporNerede.net — Demo Hazırlık Checklist (TR)

Bu checklist, ürünü pazarlama demosu veya kullanıcı denemesi öncesinde güvenli ve etkileyici şekilde hazırlamak içindir.

## 1) Teknik Hazırlık

- Son migration'lar uygulandı mı? (`npm run db:migrate`)
- Demo veri paketi yüklendi mi? (`npm run demo:seed`)
- Build başarılı mı? (`npm run build`)
- Health kontrolü temiz mi? (`/api/health`, `/api/health?deep=1`)

## 2) Demo Hesapları

- Demo admin hesabı çalışıyor mu?
- Demo kulüp hesabı çalışıyor mu?
- Demo kulüp hesabı panelde kendi kulübünü görüyor mu?
- Demo admin başvuru listesi/detayına erişebiliyor mu?

## 3) Ürün Akışı Kontrolü

- Public arama (`/ara`) sonuçları dolu ve anlamlı mı?
- Kulüp detay (`/kulupler/[id]`) programlarla birlikte düzgün mü?
- Panel profil güncelleme çalışıyor mu?
- Panel kurs/program CRUD akışı düzgün mü?
- Admin durum güncelleme + not + belge akışı çalışıyor mu?

## 4) Demo Hikayesi

- Açılış akışı: Landing -> Arama -> Kulüp detayı net mi?
- Kulüp tarafı akışı: Login -> Profil -> Program güncelleme net mi?
- Admin tarafı akışı: Başvuru inceleme -> karar -> dokümantasyon net mi?
- 5 dakikalık kısa demo senaryosu hazır mı?

## 5) Risk Azaltma

- Kırık link / boş sayfa var mı?
- Kritik endpointlerde 5xx hatası var mı?
- Gerekirse rollback komutu hazır mı? (`npm run rollback:remote`)
- Demo sonrası temizleme planı hazır mı? (demo data reset vb.)

## 6) Demo Sonrası

- Gelen geri bildirimler notlandı mı?
- En kritik 3 ürün iyileştirmesi seçildi mi?
- `activeContext.md` ve `progress.md` güncellendi mi?