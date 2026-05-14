# SporNerede.net — Organik sıra ve CTR (LLM şart değil)

Bu doküman **yüksek gösterim / düşük CTR** ve **yerel + uzun kuyruk** trafiği için uygulanabilir, **bütçesiz** bir çerçevedir. Teknik SEO omurgası `seo-ads-plan.md` (Faz 12) ve faz checklist’i `faz-gelistirme-checklist-tr.md` (özellikle **Faz 14**) ile birlikte okunmalıdır.

**LLM / yerel model (Ollama, toplu meta üretimi, vizyon ile alt metin)** bilinçli olarak **sonraya** bırakılmıştır; bütçe ve QA süreci geldiğinde `growth-revenue-traffic-tr.md` §2 ile birleştirilebilir.

---

## 1. GSC: “Yüksek gösterim, düşük CTR” operasyonu

1. Search Console → **Performans** → **Sayfalar** ve **Sorgular** → tarih aralığı (ör. son 28 gün) → **Dışa aktar** (CSV veya Google Sheets’e).
2. Tabloda örnek filtreler (eşikleri verinize göre ayarlayın):
   - Gösterim üst çeyrek veya `> N` (ör. 500+),
   - CTR düşük (ör. `< %3`),
   - Ortalama konum iyi (ör. `≤ 10`) ama tıklama yok → **başlık + snippet** revizyon adayı.
3. Her satır için kısa not: **arama niyeti** (bilgi / yerel liste / marka) + **tek somut vaat** (deneme dersi, adres, yaş grubu, seans saati).
4. Çıktı: sprint listesi (haftalık 30–45 dk); öncelik “yüksek gösterim + düşük CTR + iş kritik URL”.

LLM bu adımı hızlandırabilir; **Excel/Sheets filtreleri** aynı fırsat setini üretir.

---

## 2. Programatik `<title>` ve `meta description` (şablon + kod)

**Hedef:** Yüzlerce dinamik sayfada manuel yazım yerine **denetlenebilir şablonlar**; Google karakter disiplini kodda zorunlu (title ~60, description ~150; kesim `truncate` ile).

**Veri kaynağı (PocketBase):** kulüp adı, program adı, il, ilçe, branş, varsa kısa özet / yaş / deneme bilgisi (panelde isteğe bağlı zorunlu alan açılabilir).

**Örnek şablon aileleri (taslak):**

| Sayfa tipi | Title örnek mantığı | Description örnek mantığı |
| --- | --- | --- |
| Şehir / ilçe / branş | `[Branş] kursları [İlçe], [Şehir] \| SporNerede` | Bölgede kulüp/ilan özeti + net CTA (listeyi incele). |
| Kulüp detay | `[Kulüp] — [Branş] [İlçe] \| Programlar ve iletişim` | Adres/öne çıkan program + telefon/CTA. |
| İlan detay | `[Program] — [Kulüp] \| [İlçe], [Şehir]` | Tarih/saat veya deneme + liste detayına yönlendirme. |

**Kaçınılması gerekenler:** Her sayfada “2026 / güncel” spam’i; başlıkta yanıltıcı clickbait; middleware ile **rastgele** farklı title (canonical ve tutarlılık riski). Kontrollü deney: bkz. §5.

**Uygulama yeri (kod):** Astro `BaseLayout` / sayfa bazlı props; merkezi helper (ör. `src/lib/seo/programmaticMeta.ts` — ileride eklenecek) ile tek kaynak.

---

## 3. JSON-LD ve rich sonuçlar

- **Mevcut:** Kulüp / ilan için `Course`, `LocalBusiness` / `SportsActivityLocation`, breadcrumb, vb. (`src/lib/seo/jsonld.ts`).
- **Faz 14 ile genişletme:** `FAQPage` (şehir–branş, şehir–ilçe–branş), rehberde `HowTo` / `FAQPage`, haberde `NewsArticle` (yazar + tarih).
- **SSS içeriği:** İlk aşamada **editoryal** 3–4 soru (şablon + yerel/branş dinamik cümle); kopya “thin FAQ” üretmemek.
- **Politika uyarısı:** Gerçek kullanıcı yorumu / toplanabilir puan yoksa **`AggregateRating` veya yapay yıldız** şemasından kaçınmak; Google yönergeleri ve güven açısından riskli.

---

## 4. İçerik ve iç link (yerel + uzun kuyruk)

- Programatik landing’lerde: **benzersiz giriş** + **SSS** + **iç link** (kulüp, ilan, haber); boş kombinasyonlarda zaten `noindex` disiplini korunur.
- Haber ve ilan detaylarından ilgili **şehir–branş hub**’larına düzenli bağlantı (otomatik blok veya yayın checklist’i — `faz-gelistirme-checklist-tr.md`).

---

## 5. Başlık / açıklama deneyi (A/B mantığı, LLM’siz)

- Google otomatik title A/B sunmaz; pratik model: **ayda küçük bir URL seti** (ör. 20 sayfa), title/description güncelle, **4 hafta** GSC’de aynı URL için CTR ve gösterim izle.
- **Varyasyon aileleri** (elle veya şablon): konum ağırlıklı, program/fayda ağırlıklı, soru formatı (abartısız). Kazanan aile → şablon güncellemesi.

---

## 6. Görsel SEO

- Anlamlı **dosya adı** + açıklayıcı **`alt`** (panel kuralı / şablon); galeri için mevcut iyileştirmelerle uyumlu.
- İleride bütçe: vizyon modeli ile alt üretimi (ayrı faz).

---

## 7. Ölçüm (Faz 13 ile hizalı)

- Production GA4/GTM stabil olduktan sonra: programatik URL → kulüp detay → `lead_*` event zinciri; GSC’deki düşük CTR URL’leri ile kesiştirme (`mvp-metrics.md` haftalık/aylık notlar).

---

## İleride: LLM entegrasyonu (bütçe + QA sonrası)

- GSC CSV özetinde yerel model ile önceliklendirme.
- Batch meta üretimi (çıktı mutlaka insan veya kural kontrolünden geçer).
- Vizyon ile alt metin.

Bu maddeler şimdilik **yol haritası notu** olarak burada kalır; sprinte alınmadan önce `growth-revenue-traffic-tr.md` ve ürün onayı gerekir.
