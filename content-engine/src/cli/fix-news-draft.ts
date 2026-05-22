import { getAdminPb } from '../pb/client.js';
import { requirePocketBaseAdmin } from '../config.js';

const slug = process.argv[2] || 'haber-1779471595248';

const baslik = 'İstanbul’da voleybol kursu arayanlar için kayıt rehberi';
const seoTitle = 'İstanbul voleybol kursu — kayıt ve seçim rehberi';
const seoDescription =
  'İstanbul’da voleybol kursu mu arıyorsunuz? Ders programı, yaş grupları ve kulüp seçimi için SporNerede ile hızlı kayıt adımlarını okuyun.';

const konu = 'istanbul voleybol kursu';
const ozet = `<!-- ce-konu:${konu} -->
<p>İstanbul’da voleybol öğrenmek veya seviyenizi geliştirmek isteyenler için kurs seçimi artık tek bir platformdan takip edilebiliyor. <strong>SporNerede</strong>, şehir genelindeki kulüp ve kurs ilanlarını şeffaf biçimde listeliyor; böylece yaş grubu, lokasyon ve program detaylarını karşılaştırarak kayıt sürecine hızlı başlayabilirsiniz.</p>

<h2>Kimler için uygun?</h2>
<ul>
<li>İlk kez voleybola başlayacak çocuklar ve gençler</li>
<li>Okul takımına hazırlanan sporcular</li>
<li>Hobi olarak düzenli antrenman arayan yetişkinler</li>
</ul>

<h2>Kayıt öncesi kontrol listesi</h2>
<p>Kulüp veya kurs seçerken şu bilgileri mutlaka doğrulayın:</p>
<ul>
<li>Haftalık <strong>ders programı</strong> ve antrenman süresi</li>
<li>Antrenör deneyimi ve yaş grubu ayrımı</li>
<li>Tesis olanakları (salon, soyunma odası, güvenlik)</li>
<li>Ücret, deneme dersi ve iptal koşulları</li>
</ul>

<h2>SporNerede ile nasıl ilerlenir?</h2>
<p>Platformda <strong>İstanbul</strong> ve <strong>voleybol</strong> filtrelerini kullanarak size yakın kulüpleri görebilir, ilan detayından iletişim veya başvuru bağlantısına ulaşabilirsiniz. Kayıt öncesi deneme dersi talep etmek, doğru ortamı bulmanın en pratik yoludur.</p>

<p>Güncel ilanlar ve duyurular için SporNerede’yi takip edin; yeni dönem kayıtları açıldığında haberdar olun.</p>`;

async function main() {
  requirePocketBaseAdmin();
  const pb = await getAdminPb();
  const record = await pb.collection('haberler').getFirstListItem(
    `slug = ${JSON.stringify(slug)}`,
  );
  await pb.collection('haberler').update(record.id, {
    baslik,
    kategori: 'Duyuru',
    kategoriRenk: 'blue',
    ozet,
    seoTitle,
    seoDescription,
    aktif: false,
  });
  console.log('Guncellendi:', slug);
  console.log('Baslik:', baslik);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
