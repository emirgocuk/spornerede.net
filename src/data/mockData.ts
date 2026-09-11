export type Club = {
  id: number;
  ad: string;
  il: string;
  ilSlug: string;
  brans: string;
  bransSlug: string;
  ilce: string;
  adres: string;
  yasAraligi: string;
  fiyat: string;
  telefon: string;
  aciklama: string;
  oneCikan: boolean;
  puan: number;
  yorumSayisi: number;
  emoji: string;
  renk: string;
  programSayisi?: number;
  programOzet?: string;
};

export type MembershipPlan = {
  kod: string;
  ad: string;
  ucret: number;
  periyot: 'monthly' | 'yearly' | 'one_time';
  aciklama: string;
};

export type Branch = {
  slug: string;
  isim: string;
  emoji: string;
  renk: string;
  aciklama: string;
};

export const BRANCHES: Branch[] = [
  { slug: 'futbol', isim: 'Futbol', emoji: '⚽', renk: '#22C55E', aciklama: 'Takım ruhu, strateji, hız' },
  { slug: 'basketbol', isim: 'Basketbol', emoji: '🏀', renk: '#F97316', aciklama: 'Sıçrama, çeviklik, koordinasyon' },
  { slug: 'yuzme', isim: 'Yüzme', emoji: '🏊', renk: '#3B82F6', aciklama: '4 teknik, tam vücut antrenmanı' },
  { slug: 'tenis', isim: 'Tenis', emoji: '🎾', renk: '#EAB308', aciklama: 'Refleksler, strateji, dayanıklılık' },
  { slug: 'karate', isim: 'Karate', emoji: '🥋', renk: '#EF4444', aciklama: 'Disiplin, güç, öz savunma' },
  { slug: 'jimnastik', isim: 'Cimnastik', emoji: '🤸', renk: '#EC4899', aciklama: 'Esneklik, güç, denge' },
  { slug: 'voleybol', isim: 'Voleybol', emoji: '🏐', renk: '#8B5CF6', aciklama: 'Takım çalışması, refleks' },
  { slug: 'taekwondo', isim: 'Taekwondo', emoji: '🥋', renk: '#DC2626', aciklama: 'Kore dövüş sanatı, esneklik' },
  { slug: 'atletizm', isim: 'Atletizm', emoji: '🏃', renk: '#14B8A6', aciklama: 'Koşu, atlama, atma' },
  { slug: 'judo', isim: 'Judo', emoji: '🥋', renk: '#DC2626', aciklama: 'Düşürme teknikleri, denge' },
  { slug: 'badminton', isim: 'Badminton', emoji: '🏸', renk: '#10B981', aciklama: 'Hız, refleks, koordinasyon' },
  { slug: 'masa-tenisi', isim: 'Masa Tenisi', emoji: '🏓', renk: '#F59E0B', aciklama: 'El-göz koordinasyonu, taktik' },
  { slug: 'satranc', isim: 'Satranç', emoji: '♟️', renk: '#57534E', aciklama: 'Zihinsel strateji ve taktik' },
  { slug: 'oryantiring', isim: 'Oryantiring', emoji: '🧭', renk: '#059669', aciklama: 'Harita ve pusula ile hedef bulma' },
  { slug: 'gures', isim: 'Güreş', emoji: '🤼', renk: '#B45309', aciklama: 'Güç, denge ve teknik mücadele' },
  { slug: 'okculuk', isim: 'Okçuluk', emoji: '🏹', renk: '#65A30D', aciklama: 'Odaklanma, duruş ve isabet' },
  { slug: 'boks', isim: 'Boks', emoji: '🥊', renk: '#EF4444', aciklama: 'Çeviklik, güç ve savunma sanatı' },
  { slug: 'kurek', isim: 'Kürek', emoji: '🚣', renk: '#0284C7', aciklama: 'Su sporları, dayanıklılık ve takım ruhu' },
  { slug: 'sup', isim: 'SUP', emoji: '🏄', renk: '#06B6D4', aciklama: 'Stand Up Paddleboarding (kürekli sörf), denge ve su sporu' },
  { slug: 'krav-maga', isim: 'Krav Maga', emoji: '🥋', renk: '#DC2626', aciklama: 'Yakın dövüş, taktik savunma ve refleks' },
  { slug: 'sualti-hokeyi', isim: 'Sualtı Hokeyi', emoji: '🤿', renk: '#0EA5E9', aciklama: 'Havuz dibinde palet ve şnorkelle oynanan dinamik takım sporu' },
];

export const CLUBS: Club[] = [
  {
    id: 1,
    ad: 'Ankaragucu Spor Akademisi',
    il: 'Ankara',
    ilSlug: 'ankara',
    brans: 'Futbol',
    bransSlug: 'futbol',
    ilce: 'Cankaya',
    adres: 'Ataturk Blv. No:10, Cankaya, Ankara',
    yasAraligi: '6-18',
    fiyat: '800 TL/ay',
    telefon: '0312 425 00 00',
    aciklama: 'Turkiye nin koklu kuluplerinden biri. UEFA lisansli antrenorlerle profesyonel futbol egitimi.',
    oneCikan: true,
    puan: 4.8,
    yorumSayisi: 124,
    emoji: '⚽',
    renk: '#22C55E',
  },
  {
    id: 2,
    ad: 'Ankara Yuzme Spor Kulubu',
    il: 'Ankara',
    ilSlug: 'ankara',
    brans: 'Yuzme',
    bransSlug: 'yuzme',
    ilce: 'Kecioren',
    adres: 'Etlik Cad. No:45, Kecioren, Ankara',
    yasAraligi: '4-16',
    fiyat: '650 TL/ay',
    telefon: '0312 380 22 33',
    aciklama: 'Olimpik havuzu ve uzman kadrosuyla 4 yasindan itibaren yuzme egitimi.',
    oneCikan: true,
    puan: 4.7,
    yorumSayisi: 89,
    emoji: '🏊',
    renk: '#3B82F6',
  },
  {
    id: 3,
    ad: 'Baskent Basketbol Okulu',
    il: 'Ankara',
    ilSlug: 'ankara',
    brans: 'Basketbol',
    bransSlug: 'basketbol',
    ilce: 'Yenimahalle',
    adres: 'Batikent Spor Salonu, Yenimahalle, Ankara',
    yasAraligi: '8-20',
    fiyat: '700 TL/ay',
    telefon: '0312 212 55 66',
    aciklama: 'TBF uyesi kulup. Minibasket, altyapi ve yetiskin kategorilerinde egitim.',
    oneCikan: false,
    puan: 4.5,
    yorumSayisi: 67,
    emoji: '🏀',
    renk: '#F97316',
  },
  {
    id: 4,
    ad: 'Sincan Karate Spor Kulubu',
    il: 'Ankara',
    ilSlug: 'ankara',
    brans: 'Karate',
    bransSlug: 'karate',
    ilce: 'Sincan',
    adres: 'Sincan Spor Salonu, Sincan, Ankara',
    yasAraligi: '5-50',
    fiyat: '450 TL/ay',
    telefon: '0312 270 11 22',
    aciklama: '30 yillik tecrube. WKF onayli antrenorler esliginde Shotokan ve Kyokushin karate.',
    oneCikan: false,
    puan: 4.6,
    yorumSayisi: 43,
    emoji: '🥋',
    renk: '#EF4444',
  },
  {
    id: 5,
    ad: 'Ankara Jimnastik ve Dans Akademisi',
    il: 'Ankara',
    ilSlug: 'ankara',
    brans: 'Jimnastik',
    bransSlug: 'jimnastik',
    ilce: 'Cankaya',
    adres: 'Kizilay Spor Merkezi, Cankaya, Ankara',
    yasAraligi: '3-15',
    fiyat: '900 TL/ay',
    telefon: '0312 418 77 88',
    aciklama: 'Artistik, ritmik jimnastik ve cocuk jimnastigi. Milli takim kokenli antrenorler.',
    oneCikan: true,
    puan: 4.9,
    yorumSayisi: 152,
    emoji: '🤸',
    renk: '#EC4899',
  },
  {
    id: 6,
    ad: 'Mamak Tenis Kulubu',
    il: 'Ankara',
    ilSlug: 'ankara',
    brans: 'Tenis',
    bransSlug: 'tenis',
    ilce: 'Mamak',
    adres: 'Mamak Tenis Kortu, Mamak, Ankara',
    yasAraligi: '6-60',
    fiyat: '1100 TL/ay',
    telefon: '0312 360 44 55',
    aciklama: '8 kort, 4 yuzey secenegi. Cocuk, yetiskin ve grup dersleri mevcut.',
    oneCikan: false,
    puan: 4.4,
    yorumSayisi: 38,
    emoji: '🎾',
    renk: '#EAB308',
  },
  {
    id: 7,
    ad: 'Etimesgut Voleybol Spor Kulubu',
    il: 'Ankara',
    ilSlug: 'ankara',
    brans: 'Voleybol',
    bransSlug: 'voleybol',
    ilce: 'Etimesgut',
    adres: 'Etimesgut Spor Salonu, Etimesgut, Ankara',
    yasAraligi: '10-22',
    fiyat: '550 TL/ay',
    telefon: '0312 244 88 99',
    aciklama: 'TVF lisansli kulup. Kadin ve erkek kategorilerinde Ankara Ligi nde yarisan takim.',
    oneCikan: false,
    puan: 4.3,
    yorumSayisi: 29,
    emoji: '🏐',
    renk: '#8B5CF6',
  },
  {
    id: 8,
    ad: 'Golbasi Judo Spor Kulubu',
    il: 'Ankara',
    ilSlug: 'ankara',
    brans: 'Judo',
    bransSlug: 'judo',
    ilce: 'Golbasi',
    adres: 'Golbasi Belediye Spor Salonu, Ankara',
    yasAraligi: '5-40',
    fiyat: '400 TL/ay',
    telefon: '0312 484 33 44',
    aciklama: 'Judo odakli teknik egitim ve turnuva hazirlik programlari.',
    oneCikan: false,
    puan: 4.5,
    yorumSayisi: 51,
    emoji: '🥊',
    renk: '#6366F1',
  },
  {
    id: 9,
    ad: 'Krav Maga Savunma Akademisi',
    il: 'Ankara',
    ilSlug: 'ankara',
    brans: 'Krav Maga',
    bransSlug: 'krav-maga',
    ilce: 'Cankaya',
    adres: 'Tunalı Hilmi Cad. No:82, Çankaya, Ankara',
    yasAraligi: '12-50',
    fiyat: '850 TL/ay',
    telefon: '0312 468 00 11',
    aciklama: 'Sertifikalı eğitmenler eşliğinde yakın dövüş, taktik savunma ve refleks geliştirme programları.',
    oneCikan: true,
    puan: 4.9,
    yorumSayisi: 32,
    emoji: '🥋',
    renk: '#DC2626',
  },
];

export const CITIES = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara', 'Antalya', 'Artvin', 'Aydın', 'Balıkesir',
  'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum', 'Denizli',
  'Diyarbakır', 'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari',
  'Hatay', 'Isparta', 'Mersin', 'İstanbul', 'İzmir', 'Kars', 'Kastamonu', 'Kayseri', 'Kırklareli', 'Kırşehir',
  'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Kahramanmaraş', 'Mardin', 'Muğla', 'Muş', 'Nevşehir',
  'Niğde', 'Ordu', 'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas', 'Tekirdağ', 'Tokat',
  'Trabzon', 'Tunceli', 'Şanlıurfa', 'Uşak', 'Van', 'Yozgat', 'Zonguldak', 'Aksaray', 'Bayburt', 'Karaman',
  'Kırıkkale', 'Batman', 'Şırnak', 'Bartın', 'Ardahan', 'Iğdır', 'Yalova', 'Karabük', 'Kilis', 'Osmaniye', 'Düzce',
];

export const DISTRICTS = [
  'Altındağ', 'Çankaya', 'Etimesgut', 'Gölbaşı', 'Keçiören', 'Mamak',
  'Pursaklar', 'Sincan', 'Yenimahalle', 'Çubuk', 'Polatlı',
];

export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    kod: 'aylik',
    ad: 'Aylık',
    ucret: 1500,
    periyot: 'monthly',
    aciklama: 'Aylık paket: 1500 TL.',
  },
  {
    kod: 'alti-aylik',
    ad: '6 Aylık',
    ucret: 3000,
    periyot: 'one_time',
    aciklama: '6 aylık paket: 3000 TL.',
  },
  {
    kod: 'on-iki-aylik',
    ad: 'Yıllık',
    ucret: 5000,
    periyot: 'yearly',
    aciklama: 'Yıllık paket: 5000 TL.',
  },
];

export function sortFeaturedFirst<T extends { oneCikan: boolean }>(items: T[]): T[] {
  return [...items].sort((a, b) => Number(b.oneCikan) - Number(a.oneCikan));
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .replaceAll(' ', '-')
    .replaceAll('.', '')
    .replaceAll(',', '')
    .replaceAll("'", '')
    .replaceAll('ı', 'i')
    .replaceAll('ğ', 'g')
    .replaceAll('ü', 'u')
    .replaceAll('ş', 's')
    .replaceAll('ö', 'o')
    .replaceAll('ç', 'c');
}

