import PocketBase from 'pocketbase';
import { existsSync, readFileSync } from 'node:fs';

function loadLocalEnv() {
  if (!existsSync('.env')) return;
  const lines = readFileSync('.env', 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    if (!key || process.env[key]) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, '');
  }
}

function slugify(value) {
  return String(value ?? '')
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const NEWS_ITEMS = [
  {
    kategori: 'Duyuru',
    kategoriRenk: 'red',
    baslik: 'SporNerede 2026 Yaz Donemi Kayitlari Basladi',
    ozet:
      '<p>Yaz donemi kurs ve etkinlik kayitlari acildi. Sehir ve brans filtreleri ile size en uygun kulubu kolayca bulabilirsiniz.</p>',
    seoTitle: 'SporNerede Yaz Donemi Kayitlari Basladi',
    seoDescription:
      '2026 yaz donemi spor kurs kayitlari basladi. Sehir, ilce ve bransa gore kulup arayin.',
  },
  {
    kategori: 'Altyapi',
    kategoriRenk: 'blue',
    baslik: 'Ankara ve Istanbulda Yeni Altyapi Programlari Acildi',
    ozet:
      '<p>Futbol, basketbol ve yuzme altyapi programlarinda yeni kontenjanlar acildi. Basvuru icin detay sayfalarini inceleyebilirsiniz.</p>',
    seoTitle: 'Yeni Altyapi Programlari Acildi',
    seoDescription:
      'Ankara ve Istanbulda yeni altyapi spor programlari acildi. Kontenjanlar sinirlidir.',
  },
  {
    kategori: 'Etkinlik',
    kategoriRenk: 'green',
    baslik: 'Hafta Sonu Acik Hava Spor Senligi Duzenleniyor',
    ozet:
      '<p>Bu hafta sonu bircok ilde acik hava spor etkinlikleri yapilacak. Program akisi ve katilim kosullari haber detayinda.</p>',
    seoTitle: 'Acik Hava Spor Senligi 2026',
    seoDescription:
      'Hafta sonu duzenlenecek acik hava spor senligi etkinlik detaylari ve katilim bilgileri.',
  },
  {
    kategori: 'Kulupler',
    kategoriRenk: 'purple',
    baslik: 'Kulup Profili Guncellemeleri Icin Yeni Donem',
    ozet:
      '<p>Kulupler icin profil, program ve galeri guncelleme donemi basladi. Dogru bilgi girisi ile daha fazla gorunurluk elde edebilirsiniz.</p>',
    seoTitle: 'Kulup Profili Guncelleme Donemi',
    seoDescription:
      'Kulup profili ve program bilgilerini guncelleyerek kullanicilara daha hizli ulasin.',
  },
  {
    kategori: 'Rehber',
    kategoriRenk: 'orange',
    baslik: 'Dogru Spor Kursu Nasil Secilir 5 Pratik Ipucu',
    ozet:
      '<p>Yas grubu, antrenor profili, lokasyon ve ders saatleri gibi kriterlerle size en uygun spor kursunu secmek icin rehber hazirladik.</p>',
    seoTitle: 'Spor Kursu Secimi Icin 5 Ipucu',
    seoDescription:
      'Spor kursu secerken dikkat edilmesi gereken 5 temel kriteri ogrenin.',
  },
  {
    kategori: 'Sistem',
    kategoriRenk: 'gray',
    baslik: 'Arama Altyapisi ve Site Performansi Iyilestirildi',
    ozet:
      '<p>Arama ve filtreleme performansini iyilestiren teknik guncellemeler yayina alindi. Sayfalar artik daha hizli aciliyor.</p>',
    seoTitle: 'SporNerede Performans Iyilestirmeleri',
    seoDescription:
      'Arama altyapisi ve performans iyilestirmeleri ile daha hizli bir deneyim sunuluyor.',
  },
];

async function run() {
  loadLocalEnv();
  if (!process.env.POCKETBASE_URL) throw new Error('POCKETBASE_URL tanimli degil.');
  if (!process.env.POCKETBASE_ADMIN_EMAIL || !process.env.POCKETBASE_ADMIN_PASSWORD) {
    throw new Error('POCKETBASE admin bilgileri tanimli degil.');
  }

  const pb = new PocketBase(process.env.POCKETBASE_URL);
  await pb
    .collection('_superusers')
    .authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD);

  const today = new Date().toISOString().slice(0, 10);
  const stamp = Date.now();
  let created = 0;

  for (let i = 0; i < NEWS_ITEMS.length; i += 1) {
    const item = NEWS_ITEMS[i];
    const slug = `${slugify(item.baslik)}-${stamp + i}`;
    await pb.collection('haberler').create({
      legacyId: stamp + i,
      kategori: item.kategori,
      kategoriRenk: item.kategoriRenk,
      tarih: today,
      baslik: item.baslik,
      ozet: item.ozet,
      link: '#',
      aktif: true,
      slug,
      seoTitle: item.seoTitle,
      seoDescription: item.seoDescription,
    });
    created += 1;
  }

  const total = await pb.collection('haberler').getList(1, 1);
  console.log(`Eklenen haber: ${created}`);
  console.log(`Toplam haber sayisi: ${total.totalItems}`);
}

run().catch((error) => {
  console.error('Haber seed hatasi:', error);
  process.exit(1);
});
