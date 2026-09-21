/**
 * Türkçe başlık ve metin normalizasyonu, imla ve karakter düzeltme yardımcıları.
 */

const TURKISH_ASCII_WORD_MAP: Record<string, string> = {
  cankaya: 'Çankaya',
  kecioren: 'Keçiören',
  kadikoy: 'Kadıköy',
  besiktas: 'Beşiktaş',
  uskudar: 'Üsküdar',
  sisli: 'Şişli',
  bakirkoy: 'Bakırköy',
  atasehir: 'Ataşehir',
  umraniye: 'Ümraniye',
  beylikduzu: 'Beylikdüzü',
  etimesgut: 'Etimesgut',
  yenimahalle: 'Yenimahalle',
  golbasi: 'Gölbaşı',
  karsiyaka: 'Karşıyaka',
  bayrakli: 'Bayraklı',
  nilufer: 'Nilüfer',
  osmangazi: 'Osmangazi',
  yildirim: 'Yıldırım',
  muratpasa: 'Muratpaşa',
  konyaalti: 'Konyaaltı',
  kepez: 'Kepez',
  seyhan: 'Seyhan',
  cukurova: 'Çukurova',
  selcuklu: 'Selçuklu',
  meram: 'Meram',
  istanbul: 'İstanbul',
  ankara: 'Ankara',
  izmir: 'İzmir',
  bursa: 'Bursa',
  antalya: 'Antalya',
  adana: 'Adana',
  konya: 'Konya',
  fiyatlari: 'Fiyatları',
  fiyatlar: 'Fiyatlar',
  fiyati: 'Fiyatı',
  fiyat: 'Fiyat',
  kulupleri: 'Kulüpleri',
  kulubu: 'Kulübü',
  kulup: 'Kulüp',
  kulupler: 'Kulüpler',
  ucretleri: 'Ücretleri',
  ucreti: 'Ücreti',
  ucret: 'Ücret',
  kursu: 'Kursu',
  kurslari: 'Kursları',
  kurslar: 'Kurslar',
  hakkinda: 'Hakkında',
  guncel: 'Güncel',
  bilgiler: 'Bilgiler',
  bilgisi: 'Bilgisi',
  rehberi: 'Rehberi',
  cocuk: 'Çocuk',
  cocuklar: 'Çocuklar',
  yetiskin: 'Yetişkin',
  yetiskinler: 'Yetişkinler',
  baslangic: 'Başlangıç',
  ogrenmek: 'Öğrenmek',
  secimi: 'Seçimi',
  secim: 'Seçim',
  tavsiyeleri: 'Tavsiyeleri',
  onerileri: 'Önerileri',
  yuzme: 'Yüzme',
  satranc: 'Satranç',
  gures: 'Güreş',
  okculuk: 'Okçuluk',
  kurek: 'Kürek',
  taekwondo: 'Taekwondo',
  tekvando: 'Tekvando',
  jimnastik: 'Cimnastik',
  cimnastik: 'Cimnastik',
  kayit: 'Kayıt',
  kayitlari: 'Kayıtları',
  sayokan: 'Sayokan',
};

const LOWERCASE_CONJUNCTIONS = new Set(['ve', 'ile', 'için', 'icin', 'de', 'da', 'mi', 'mı', 'mu', 'mü']);

/**
 * Verilen arama anahtarını veya ham başlığı düzgün Türkçe Başlık Düzenine (Title Case) çevirir.
 * ASCII karakterleri düzeltir ve bağlaçları küçük tutar.
 */
export function toTurkishTitleCase(str: string): string {
  if (!str) return '';
  const clean = str.trim().replace(/\s+/g, ' ');
  const words = clean.split(' ');

  return words
    .map((rawWord, idx) => {
      const lower = rawWord.toLowerCase();
      // Kontrol: bilinen sözlük eşleşmesi
      const punctuationMatch = rawWord.match(/^([^a-zA-ZçÇğĞıİöÖşŞüÜ]*)(.*?)([^a-zA-ZçÇğĞıİöÖşŞüÜ]*)$/);
      const prefix = punctuationMatch?.[1] ?? '';
      const coreWord = (punctuationMatch?.[2] ?? rawWord).toLowerCase();
      const suffix = punctuationMatch?.[3] ?? '';

      // Bağlaç ilk kelime değilse küçük kalsın
      if (idx > 0 && LOWERCASE_CONJUNCTIONS.has(coreWord)) {
        return prefix + (coreWord === 'icin' ? 'için' : coreWord) + suffix;
      }

      if (TURKISH_ASCII_WORD_MAP[coreWord]) {
        return prefix + TURKISH_ASCII_WORD_MAP[coreWord] + suffix;
      }

      // Genel Türkçe Title Case
      if (!coreWord) return rawWord;
      const firstChar = coreWord.charAt(0).toLocaleUpperCase('tr-TR');
      const rest = coreWord.slice(1).toLocaleLowerCase('tr-TR');
      return prefix + firstChar + rest + suffix;
    })
    .join(' ');
}

/**
 * Türkçe başlık veya metinlerdeki yaygın devrik/çeviri gramer hatalarını deterministik düzeltir.
 * Örneğin: "İlk Ay Ne Bekler Siz?" -> "İlk Ayda Sizi Neler Bekler?"
 */
export function repairTurkishGrammarInTitle(title: string): string {
  let t = String(title ?? '').trim();
  if (!t) return '';

  // 1. "İlk Ay Ne Bekler Siz?" / "İlk Ay Neler Bekler Siz?" hataları
  t = t.replace(/(?:ilk\s+ay|ilk\s+ayda)\s+(?:ne|neler)\s+bekler\s+siz\b/gi, 'İlk Ayda Sizi Neler Bekler?');
  t = t.replace(/(?:ne|neler)\s+bekler\s+siz\b\??/gi, 'Sizi Neler Bekler?');
  t = t.replace(/\bbekler\s+siz\b\??/gi, 'Sizi Bekliyor');
  t = t.replace(/\bbekler\s+sen\b\??/gi, 'Seni Bekliyor');
  t = t.replace(/\bbekler\s+bizi\b\??/gi, 'Bizi Neler Bekler?');

  // 2. Yasaklı genel başlık kalıpları
  t = t.replace(/\s+hakkında\s+güncel\s+bilgiler$/gi, ': Fiyatlar, Kulüpler ve Kayıt');
  t = t.replace(/\s+hakkinda\s+guncel\s+bilgiler$/gi, ': Fiyatlar, Kulüpler ve Kayıt');
  t = t.replace(/\s+hakkında\s+her\s+şey$/gi, ': Kapsamlı Rehber');
  t = t.replace(/\s+hakkında\s+merak\s+edilenler$/gi, ': Bilinmesi Gerekenler');

  // 3. Başlığın ilk harfi her zaman büyük olmalı
  if (t.length > 0) {
    t = t.charAt(0).toLocaleUpperCase('tr-TR') + t.slice(1);
  }

  // 4. Eğer tüm başlık küçük harfle girilmişse Title Case yap
  const hasUppercase = /[A-ZÇĞİÖŞÜ]/.test(t);
  if (!hasUppercase && t.length > 0) {
    t = toTurkishTitleCase(t);
  }

  return t.trim();
}
