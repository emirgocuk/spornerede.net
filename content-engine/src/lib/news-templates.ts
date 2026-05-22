import { parseKonu, type ParsedKonu } from './parse-konu.js';

export type NewsTemplate = {
  id: string;
  name: string;
  score: (k: ParsedKonu) => number;
  baslik: (k: ParsedKonu) => string;
  seoTitle: (k: ParsedKonu) => string;
  seoDescription: (k: ParsedKonu) => string;
  kategori: string;
  kategoriRenk: string;
  body: (k: ParsedKonu) => string;
};

function fill(s: string, k: ParsedKonu) {
  return s
    .replace(/\{\{KONU\}\}/g, k.raw)
    .replace(/\{\{SEHIR\}\}/g, k.sehirLabel)
    .replace(/\{\{BRANS\}\}/g, k.bransLabel)
    .replace(/\{\{SEHIR_RAW\}\}/g, k.sehir || 'turkiye')
    .replace(/\{\{BRANS_RAW\}\}/g, k.brans || 'spor');
}

/** 10 sablon — LLM yok; otonom SEO */
export const NEWS_TEMPLATES: NewsTemplate[] = [
  {
    id: 'sehir_brans_kurs',
    name: 'Şehir + branş kursu',
    score: (k) =>
      k.hasSehir && k.hasBrans && /\b(kursu|kurslari|kursları|kurs)\b/.test(k.lower) ? 100 : 0,
    baslik: (k) => fill('{{SEHIR}} {{BRANS}} kursu: kayıt ve seçim rehberi', k),
    seoTitle: (k) => fill('{{SEHIR}} {{BRANS}} kursu — kayıt rehberi', k).slice(0, 60),
    seoDescription: (k) =>
      fill(
        '{{SEHIR}} bölgesinde {{BRANS}} kursu arayanlar için program, yaş grupları ve kayıt adımları. SporNerede ile yakınınızdaki kulüpleri karşılaştırın.',
        k,
      ).slice(0, 155),
    kategori: 'Spor',
    kategoriRenk: 'green',
    body: (k) =>
      fill(
        `<p>{{SEHIR}} ve çevresinde {{BRANS}} öğrenmek veya seviyenizi geliştirmek isteyenler için kurs seçenekleri artık tek bir platform üzerinden takip edilebiliyor. <strong>SporNerede</strong>, ilanları şeffaf biçimde listeler; yaş grubu, lokasyon ve ders programını karşılaştırarak kayıt sürecine hızlı başlayabilirsiniz.</p>
<h2>Kimler için uygun?</h2>
<ul>
<li>İlk kez {{BRANS}} deneyimleyecek çocuklar ve gençler</li>
<li>Okul takımına hazırlanan sporcular</li>
<li>Düzenli antrenman arayan yetişkinler</li>
</ul>
<h2>Programda neler var?</h2>
<p>Çoğu {{SEHIR}} {{BRANS}} kursunda temel teknik çalışmalar, takım oyunu ve kondisyon bir arada yürütülür. Haftalık ders sayısı ve antrenman süresi kulübe göre değişir; kayıt öncesi deneme dersi talep etmek doğru programı bulmanın en pratik yoludur.</p>
<h2>Kayıt ve kayıt süreci</h2>
<p>Kayıt öncesi şunları netleştirin: haftalık <strong>ders programı</strong>, antrenör deneyimi, tesis olanakları, ücret ve iptal koşulları. SporNerede üzerinde {{SEHIR}} ve {{BRANS}} filtreleriyle size yakın kulüpleri görebilir, ilan detayından iletişim veya başvuru bağlantısına ulaşabilirsiniz.</p>
<p>Güncel ilanlar için SporNerede’yi takip edin; yeni dönem kayıtları açıldığında haberdar olun.</p>`,
        k,
      ),
  },
  {
    id: 'brans_nedir',
    name: 'Branş nedir',
    score: (k) => (/\bnedir\b/.test(k.lower) && k.hasBrans ? 90 : 0),
    baslik: (k) => fill('{{BRANS}} nedir? Başlangıç rehberi', k),
    seoTitle: (k) => fill('{{BRANS}} nedir — temel bilgiler', k).slice(0, 60),
    seoDescription: (k) =>
      fill('{{BRANS}} sporunun temelleri, kimler için uygun olduğu ve kurs seçimi. SporNerede ile yakınınızdaki antrenmanları keşfedin.', k).slice(
        0,
        155,
      ),
    kategori: 'Spor',
    kategoriRenk: 'green',
    body: (k) =>
      fill(
        `<p>{{BRANS}}, hem bireysel gelişim hem de takım ruhu açısından tercih edilen branşlardan biridir. Bu yazıda {{BRANS}} sporunun temel özelliklerini, kimlerin başlayabileceğini ve kurs seçerken nelere dikkat edilmesi gerektiğini özetliyoruz.</p>
<h2>{{BRANS}} sporunun özellikleri</h2>
<p>Antrenmanlar genellikle teknik beceri, taktik bilgi ve fiziksel kondisyonu birlikte geliştirir. Yaş ve seviyeye göre gruplandırılmış sınıflar, hem güvenli hem de verimli bir öğrenme ortamı sağlar.</p>
<h2>Kimler başlayabilir?</h2>
<ul>
<li>Okul çağındaki çocuklar ve gençler</li>
<li>Hobi olarak düzenli hareket etmek isteyen yetişkinler</li>
<li>Takım sporuna geçiş yapmak isteyen sporcular</li>
</ul>
<h2>Kurs seçimi</h2>
<p>Kulüp veya kurs seçerken antrenör kadrosu, tesis, ulaşım ve program yoğunluğunu birlikte değerlendirin. <strong>SporNerede</strong> üzerinden {{BRANS}} branşına göre filtreleme yaparak size en yakın seçenekleri listeleyebilirsiniz.</p>
<p>Yakınınızdaki {{BRANS}} kurslarını keşfetmek için SporNerede arama sayfasını kullanın.</p>`,
        k,
      ),
  },
  {
    id: 'brans_fayda',
    name: 'Branş faydaları',
    score: (k) => (/\bfayda/.test(k.lower) && k.hasBrans ? 88 : 0),
    baslik: (k) => fill('{{BRANS}} faydaları: çocuklar ve gençler için', k),
    seoTitle: (k) => fill('{{BRANS}} faydaları — kısa rehber', k).slice(0, 60),
    seoDescription: (k) =>
      fill('{{BRANS}} sporunun fiziksel ve sosyal katkıları. Uygun kurs ve kulüp seçimi için SporNerede.', k).slice(0, 155),
    kategori: 'Spor',
    kategoriRenk: 'green',
    body: (k) =>
      fill(
        `<p>{{BRANS}} düzenli yapıldığında dayanıklılık, koordinasyon ve özgüven gelişimine katkı sağlar. Aileler ve sporcular için faydaları anlamak, doğru kurs ve yaş grubunu seçmeyi kolaylaştırır.</p>
<h2>Fiziksel katkılar</h2>
<p>Düzenli antrenman kas-güç dengesini destekler, hareket kabiliyetini artırır ve sağlıklı yaşam alışkanlığı oluşturur. Program yoğunluğu yaşa ve seviyeye göre ayarlanmalıdır.</p>
<h2>Sosyal ve mental katkılar</h2>
<p>Takım çalışması, disiplin ve hedef odaklılık gibi beceriler günlük hayata da yansır. Kulüp ortamı, sporcuların motivasyonunu uzun vadede destekler.</p>
<h2>Doğru kursu bulmak</h2>
<p>{{BRANS}} için kurs ararken deneme dersi imkânı, grup büyüklüğü ve güvenlik önlemlerini sorun. <strong>SporNerede</strong> ilanlarında bu bilgilere tek ekrandan ulaşabilir, birkaç kulübü karşılaştırabilirsiniz.</p>
<p>Size uygun {{BRANS}} programını bulmak için SporNerede’de arama yapın.</p>`,
        k,
      ),
  },
  {
    id: 'cocuk_brans',
    name: 'Çocuklar için branş',
    score: (k) =>
      (/\b(cocuk|cocuklar|çocuk|çocuklar)\b/.test(k.lower) && k.hasBrans ? 85 : 0),
    baslik: (k) => fill('Çocuklar için {{BRANS}} kursu nasıl seçilir?', k),
    seoTitle: (k) => fill('Çocuklar için {{BRANS}} — seçim rehberi', k).slice(0, 60),
    seoDescription: (k) =>
      fill('Çocuklar için {{BRANS}} kursu seçerken yaş, güvenlik ve program. SporNerede ile yakın kulüpleri inceleyin.', k).slice(
        0,
        155,
      ),
    kategori: 'Spor',
    kategoriRenk: 'green',
    body: (k) =>
      fill(
        `<p>Çocuklar için {{BRANS}} kursu seçerken yalnızca fiyata değil; yaş grubu uyumu, antrenör yaklaşımı ve tesis güvenliğine de bakmak gerekir. Veliler için pratik bir kontrol listesi hazırladık.</p>
<h2>Yaş ve seviye ayrımı</h2>
<p>Kursların çocukları yaş ve deneyime göre ayırması, hem güvenliği hem öğrenme hızını artırır. İlk seviyede oyun temelli çalışmalar, ilerleyen gruplarda teknik yoğunluk artabilir.</p>
<h2>Güvenlik ve tesis</h2>
<ul>
<li>Antrenman alanı zemin ve ekipman durumu</li>
<li>Soyunma odası ve sıvı tüketimi imkânı</li>
<li>Acil durum ve ilk yardım bilgisi</li>
</ul>
<h2>Kayıt ve kayıt süreci</h2>
<p>Deneme dersi ile çocuğunuzun kulübe uyumunu gözlemleyin. <strong>SporNerede</strong> üzerinden {{BRANS}} ve bulunduğunuz şehir filtreleriyle yakın kulüpleri listeleyebilir, kayıt için iletişim bilgilerine ulaşabilirsiniz.</p>
<p>Çocuğunuza uygun {{BRANS}} kurslarını SporNerede’de arayın.</p>`,
        k,
      ),
  },
  {
    id: 'sehir_spor_kurslari',
    name: 'Şehir spor kursları',
    score: (k) =>
      k.hasSehir && /\b(spor\s+kurslari|spor\s+kursları|kurslari)\b/.test(k.lower) && !k.hasBrans ? 82 : 0,
    baslik: (k) => fill('{{SEHIR}} spor kursları: nasıl karşılaştırılır?', k),
    seoTitle: (k) => fill('{{SEHIR}} spor kursları rehberi', k).slice(0, 60),
    seoDescription: (k) =>
      fill('{{SEHIR}} spor kursları arasında seçim yaparken program, konum ve ücret. SporNerede ile filtreleyin.', k).slice(
        0,
        155,
      ),
    kategori: 'Spor',
    kategoriRenk: 'blue',
    body: (k) =>
      fill(
        `<p>{{SEHIR}}’da çocuk veya yetişkinler için onlarca spor kursu bulunur. Branş, konum ve program çeşitliliği arttıkça karşılaştırmayı kolaylaştıran bir rehbere ihtiyaç duyulur.</p>
<h2>Branşa göre filtreleme</h2>
<p>Önce hedef branşı netleştirin: takım sporu mu, bireysel branş mı? Ardından haftalık gün-saat planınızı yazın; ulaşım süresi uzun olan kulüpler uzun vadede sürdürülebilirliği zorlaştırır.</p>
<h2>İlanlarda kontrol listesi</h2>
<ul>
<li>Deneme dersi ve kayıt tarihleri</li>
<li>Grup kapasitesi ve yaş sınırı</li>
<li>Ücret, taksit ve iptal politikası</li>
</ul>
<h2>SporNerede ile arama</h2>
<p><strong>SporNerede</strong>, {{SEHIR}} bölgesindeki kulüp ve kurs ilanlarını tek yerde toplar. Filtrelerle branş ve ilçe seçerek kısa listeye indirin, ardından iletişime geçin.</p>
<p>{{SEHIR}} spor kurslarını SporNerede arama sayfasında keşfedin.</p>`,
        k,
      ),
  },
  {
    id: 'sezonsal_kamp',
    name: 'Sezon / kamp',
    score: (k) => (/\b(yaz|kis|kış|kamp|donemi|dönemi|sezon)\b/.test(k.lower) ? 75 : 0),
    baslik: (k) => fill('{{KONU}} — kayıt ve planlama', k),
    seoTitle: (k) => fill('{{KONU}} | SporNerede', k).slice(0, 60),
    seoDescription: (k) =>
      fill('Sezonluk spor programları ve kamplar için kayıt bilgileri. Yakınınızdaki seçenekler SporNerede’de.', k).slice(0, 155),
    kategori: 'Etkinlik',
    kategoriRenk: 'orange',
    body: (k) =>
      fill(
        `<p>Sezon geçişlerinde spor kursları ve kamplar için erken kayıt dönemleri açılır. {{KONU}} arayan aileler için planlama ipuçlarını derledik.</p>
<h2>Erken kayıt avantajı</h2>
<p>Kontenjanlar sınırlı olduğundan popüler branşlarda yer ayırtmak için tarihleri önceden takip etmek gerekir. Program içeriğini (günlük saat, konaklama, ulaşım) yazılı olarak isteyin.</p>
<h2>Program türleri</h2>
<ul>
<li>Yarım gün kurs ve okul sonrası programlar</li>
<li>Tam gün yaz spor kampları</li>
<li>Branşa özel yoğunlaştırılmış kamplar</li>
</ul>
<h2>Kayıt ve kayıt süreci</h2>
<p>Kayıt öncesi iptal koşullarını ve sağlık bildirim formlarını okuyun. <strong>SporNerede</strong> üzerinden güncel kamp ve kurs ilanlarını filtreleyebilirsiniz.</p>
<p>Sezonluk programlar için SporNerede haberler ve arama bölümünü kullanın.</p>`,
        k,
      ),
  },
  {
    id: 'kulup_secimi',
    name: 'Kulüp seçimi',
    score: (k) => (/\b(kulup|kulüp|secim|seçim|nasil\s+sec)\b/.test(k.lower) ? 70 : 0),
    baslik: () => 'Spor kulübü nasıl seçilir?',
    seoTitle: () => 'Spor kulübü seçimi — kısa rehber',
    seoDescription: () =>
      'Spor kulübü ve kurs seçerken program, güvenlik ve şeffaflık. SporNerede ile karşılaştırın.'.slice(0, 155),
    kategori: 'Platform',
    kategoriRenk: 'purple',
    body: (k) =>
      fill(
        `<p>Doğru spor kulübü; branş uyumu, antrenör iletişimi ve tesis kalitesiyle ölçülür. {{KONU}} arayanlar için karar vermeyi kolaylaştıran kriterleri paylaşıyoruz.</p>
<h2>Şeffaf bilgi</h2>
<p>Ücret, ek masraflar ve ekipman gereksinimleri baştan net olmalıdır. Yazılı program ve iletişim kanalı (telefon, e-posta) bulunmayan ilanlarda temkinli ilerleyin.</p>
<h2>Deneme dersi</h2>
<p>Çoğu kulüp deneme dersi sunar. Çocuğunuzun veya sizin grubunuzla uyumunu gözlemlemek, uzun dönem memnuniyeti artırır.</p>
<h2>SporNerede ile karşılaştırma</h2>
<p><strong>SporNerede</strong> farklı kulüplerin ilanlarını yan yana görmenizi sağlar. Branş ve şehir filtreleriyle kısa liste oluşturup kayıt için iletişime geçin.</p>
<p>Yakınınızdaki kulüpleri SporNerede’de arayın.</p>`,
        k,
      ),
  },
  {
    id: 'okul_sonrasi',
    name: 'Okul sonrası spor',
    score: (k) => (/\b(okul\s+sonrasi|okul\s+sonrası)\b/.test(k.lower) ? 68 : 0),
    baslik: () => 'Okul sonrası spor kursu seçimi',
    seoTitle: () => 'Okul sonrası spor kursu rehberi',
    seoDescription: () =>
      'Okul sonrası spor programları: zaman planı, branş ve güvenlik. SporNerede ile yakın kursları bulun.'.slice(0, 155),
    kategori: 'Ebeveyn',
    kategoriRenk: 'blue',
    body: (k) =>
      fill(
        `<p>Okul sonrası spor kursları, çocukların enerjisini verimli kanalize etmek için idealdir. Program saatleri ile ödev ve dinlenme dengesini kurmak önemlidir.</p>
<h2>Zaman planı</h2>
<p>Haftada iki veya üç gün antrenman çoğu aile için sürdürülebilir bir tempodur. Ulaşım süresini 30–40 dakika ile sınırlamak motivasyonu korur.</p>
<h2>Branş çeşitliliği</h2>
<p>Takım sporları sosyal beceriyi; bireysel branşlar odak ve disiplini destekler. Çocuğunuzun ilgisine göre bir deneme dönemi planlayın.</p>
<h2>Kayıt ve kayıt süreci</h2>
<p><strong>SporNerede</strong> üzerinden okul sonrası program sunan kulüpleri listeleyebilir, {{SEHIR}} ve branş filtreleriyle arama yapabilirsiniz.</p>
<p>Okul sonrası kurslar için SporNerede aramasını kullanın.</p>`,
        k,
      ),
  },
  {
    id: 'kayit_rehberi',
    name: 'Kayıt rehberi',
    score: (k) => (/\b(kayit|kayıt|basvuru|başvuru|kaydol)\b/.test(k.lower) ? 55 : 0),
    baslik: (k) => fill('{{KONU}}: kayıt adımları', k),
    seoTitle: (k) => fill('{{KONU}} kayıt rehberi', k).slice(0, 60),
    seoDescription: (k) =>
      fill('{{KONU}} için kayıt öncesi kontrol listesi ve SporNerede ile kulüp bulma.', k).slice(0, 155),
    kategori: 'Duyuru',
    kategoriRenk: 'blue',
    body: (k) =>
      fill(
        `<p>{{KONU}} ile ilgili kayıt sürecine başlamadan önce program detaylarını ve kulüp koşullarını karşılaştırmak zaman kazandırır. Aşağıdaki adımlar çoğu branş için geçerlidir.</p>
<h2>Ön hazırlık</h2>
<ul>
<li>Hedef branş ve haftalık müsait günler</li>
<li>Bütçe ve ulaşım mesafesi</li>
<li>Sağlık durumu ve kulüp formu gereksinimleri</li>
</ul>
<h2>Kulüple iletişim</h2>
<p>Deneme dersi tarihi, grup doluluk durumu ve ekipman listesini yazılı olarak teyit edin. Sözlü vaatler yerine ilan veya e-posta onayı tercih edin.</p>
<h2>SporNerede üzerinden arama</h2>
<p><strong>SporNerede</strong> ilanlarında iletişim ve konum bilgileri yer alır. Filtrelerle size yakın seçenekleri bulup kayıt için başvurun.</p>
<p>{{KONU}} için güncel ilanları SporNerede’de inceleyin.</p>`,
        k,
      ),
  },
  {
    id: 'platform_genel',
    name: 'Genel (yedek)',
    score: () => 1,
    baslik: (k) => fill('{{KONU}} hakkında güncel bilgiler', k),
    seoTitle: (k) => fill('{{KONU}} | SporNerede', k).slice(0, 60),
    seoDescription: (k) =>
      fill('{{KONU}} ile ilgili spor kursu ve kulüp bilgileri. Türkiye geneli arama için SporNerede.', k).slice(0, 155),
    kategori: 'Duyuru',
    kategoriRenk: 'blue',
    body: (k) =>
      fill(
        `<p>{{KONU}} hakkında güncel ve tarafsız bilgi arayanlar için SporNerede, kulüp ve kurs ilanlarını tek platformda toplar. Böylece farklı kaynaklara dağılmadan program ve konum karşılaştırması yapılabilir.</p>
<h2>Neden platform kullanılır?</h2>
<p>İlanların güncelliği, iletişim bilgisi ve branş filtreleri kayıt kararını hızlandırır. Aileler ve sporcular için şeffaf bir liste sunulması önceliklidir.</p>
<h2>Nelere bakılmalı?</h2>
<ul>
<li>Ders programı ve yaş grubu</li>
<li>Tesis ve ulaşım</li>
<li>Ücret ve deneme dersi imkânı</li>
</ul>
<h2>Kayıt ve kayıt süreci</h2>
<p>Arama sonuçlarından uygun kulübe tıklayarak detay sayfasına gidin ve kayıt için paylaşılan kanalı kullanın. <strong>SporNerede</strong> düzenli olarak yeni ilanlar ekler.</p>
<p>{{KONU}} için SporNerede’de arama yaparak başlayın.</p>`,
        k,
      ),
  },
];

export function pickNewsTemplate(konu: string, recentTemplateIds: string[] = []): NewsTemplate {
  const parsed = parseKonu(konu);
  let best = NEWS_TEMPLATES[NEWS_TEMPLATES.length - 1];
  let bestScore = -1;
  for (const t of NEWS_TEMPLATES) {
    let s = t.score(parsed);
    const usedIdx = recentTemplateIds.indexOf(t.id);
    if (usedIdx >= 0) s -= (usedIdx + 1) * 10;
    if (s > bestScore) {
      bestScore = s;
      best = t;
    }
  }
  return best;
}
