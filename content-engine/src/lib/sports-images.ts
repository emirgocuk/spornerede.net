/**
 * Spor branşlarına ve ebeveyn konularına göre optimize edilmiş,
 * telifsiz (royalty-free Unsplash lisanslı) yüksek kaliteli spor görselleri kataloğu.
 */

export interface SportsImageMeta {
  url: string;
  alt: string;
  caption: string;
}

const SPORTS_IMAGE_MAP: Record<string, SportsImageMeta[]> = {
  yuzme: [
    {
      url: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=1200&q=80',
      alt: 'Çocuk yüzme kursu ve havuz antrenmanı',
      caption: 'Yüzme okullarında teknik ve nefes antrenmanı',
    },
    {
      url: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?auto=format&fit=crop&w=1200&q=80',
      alt: 'Yüzme kulübü yarışma hazırlığı',
      caption: 'Yüzme branşında altyapı ve stil geliştirme çalışmaları',
    },
  ],
  basketbol: [
    {
      url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80',
      alt: 'Basketbol okulu saha içi top sürme ve şut çalışması',
      caption: 'Genç sporcular için temel basketbol teknikleri',
    },
    {
      url: 'https://images.unsplash.com/photo-1519766304817-4f37bda74a29?auto=format&fit=crop&w=1200&q=80',
      alt: 'Basketbol takımı antrenmanı',
      caption: 'Basketbol altyapı takımlarında takım disiplini ve kondisyon',
    },
  ],
  voleybol: [
    {
      url: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=1200&q=80',
      alt: 'Voleybol kursu servis ve pas çalışması',
      caption: 'Voleybol okullarında temel vuruş teknikleri',
    },
    {
      url: 'https://images.unsplash.com/photo-1592656094267-764a45160876?auto=format&fit=crop&w=1200&q=80',
      alt: 'Voleybol takım antrenmanı ve smaç hazırlığı',
      caption: 'Altyapı voleybol takımlarında koordinasyon ve maç disiplini',
    },
  ],
  futbol: [
    {
      url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1200&q=80',
      alt: 'Futbol akademisi çim saha antrenmanı',
      caption: 'Futbol altyapı okullarında top tekniği ve pas çalışmaları',
    },
    {
      url: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1200&q=80',
      alt: 'Çocuk futbol kursu takım çalışması',
      caption: 'Gelişim liglerine hazırlanan genç yetenekler',
    },
  ],
  tenis: [
    {
      url: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1200&q=80',
      alt: 'Tenis kortunda raket ve top antrenmanı',
      caption: 'Tenis derslerinde forehand ve backhand vuruş teknikleri',
    },
    {
      url: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1200&q=80',
      alt: 'Özel tenis dersi ve kort çalışması',
      caption: 'Her yaş grubu için bireysel ve grup tenis antrenmanları',
    },
  ],
  jimnastik: [
    {
      url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80',
      alt: 'Cimnastik salonunda esneklik ve denge çalışması',
      caption: 'Erken yaşta spora başlangıç için temel cimnastik eğitimi',
    },
  ],
  savunma: [
    {
      url: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1200&q=80',
      alt: 'Dövüş sporları ve savunma antrenmanı',
      caption: 'Disiplin, odaklanma ve özgüven kazandıran savunma sporları',
    },
  ],
  okculuk: [
    {
      url: 'https://images.unsplash.com/photo-1511884642898-4c92249e20b6?auto=format&fit=crop&w=1200&q=80',
      alt: 'Okçuluk poligonunda hedef atışı',
      caption: 'Geleneksel ve olimpik okçuluk kursu çalışmaları',
    },
  ],
  bisiklet: [
    {
      url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1200&q=80',
      alt: 'Çocuk bisiklet kursu ve yol sürüşü',
      caption: 'Güvenli sürüş eğitimi ve bisiklet kulübü altyapısı',
    },
    {
      url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1200&q=80',
      alt: 'Bisiklet antrenmanı ve yarış hazırlığı',
      caption: 'Gençler için bisiklet kondisyon ve parkur çalışmaları',
    },
  ],
  atletizm: [
    {
      url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80',
      alt: 'Atletizm pisti ve koşu antrenmanı',
      caption: 'Temel koşu ve dayanıklılık antrenmanları',
    },
    {
      url: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=1200&q=80',
      alt: 'Çocuk atletizm ve sprint çalışması',
      caption: 'Atletizm branşında altyapı ve motorik beceri geliştirme',
    },
  ],
  ebeveyn: [
    {
      url: 'https://images.unsplash.com/photo-1526676037777-05a232554f77?auto=format&fit=crop&w=1200&q=80',
      alt: 'Ebeveyn ve çocuk spor rehberi',
      caption: 'Ebeveynler için doğru spor kulübü ve branş seçimi kılavuzu',
    },
    {
      url: 'https://images.unsplash.com/photo-1471295253337-3ceaaedca402?auto=format&fit=crop&w=1200&q=80',
      alt: 'Çocuk spor okulu lisans ve başlangıç süreci',
      caption: 'Sporcu lisansı ve gelişim dönemlerine göre antrenman planı',
    },
  ],
  genel: [
    {
      url: 'https://images.unsplash.com/photo-1526676037777-05a232554f77?auto=format&fit=crop&w=1200&q=80',
      alt: 'Çocuklar için spor okulu ve fiziksel gelişim',
      caption: 'SporNerede — Çocuklar ve gençler için doğru spor kulübü seçimi',
    },
    {
      url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80',
      alt: 'Atletizm pisti ve spor kulübü antrenmanı',
      caption: 'Sağlıklı yaşam ve lisanslı sporcu yetiştirme kılavuzu',
    },
  ],
};

/**
 * Konu veya başlık metnine göre en uygun telifsiz spor görselini döndürür.
 */
export function getSportsImageForTopic(topicOrTitle: string): SportsImageMeta {
  const t = (topicOrTitle || '').toLowerCase();
  let pool: SportsImageMeta[] = SPORTS_IMAGE_MAP.genel;

  if (t.includes('yuz') || t.includes('yüz') || t.includes('havuz')) {
    pool = SPORTS_IMAGE_MAP.yuzme;
  } else if (t.includes('basket')) {
    pool = SPORTS_IMAGE_MAP.basketbol;
  } else if (t.includes('voley')) {
    pool = SPORTS_IMAGE_MAP.voleybol;
  } else if (t.includes('fut')) {
    pool = SPORTS_IMAGE_MAP.futbol;
  } else if (t.includes('tenis') || t.includes('kort')) {
    pool = SPORTS_IMAGE_MAP.tenis;
  } else if (t.includes('jimnastik') || t.includes('cimnastik') || t.includes('denge')) {
    pool = SPORTS_IMAGE_MAP.jimnastik;
  } else if (t.includes('bisiklet') || t.includes('pedal') || t.includes('surus')) {
    pool = SPORTS_IMAGE_MAP.bisiklet;
  } else if (t.includes('atletizm') || t.includes('kosu') || t.includes('koşu')) {
    pool = SPORTS_IMAGE_MAP.atletizm;
  } else if (
    t.includes('boks') ||
    t.includes('karate') ||
    t.includes('taekwondo') ||
    t.includes('judo') ||
    t.includes('savunma')
  ) {
    pool = SPORTS_IMAGE_MAP.savunma;
  } else if (t.includes('okcu') || t.includes('okçu') || t.includes('yay')) {
    pool = SPORTS_IMAGE_MAP.okculuk;
  } else if (
    t.includes('ebeveyn') ||
    t.includes('yas') ||
    t.includes('yaş') ||
    t.includes('lisans') ||
    t.includes('ucret') ||
    t.includes('ücret') ||
    t.includes('maliyet') ||
    t.includes('cocuk') ||
    t.includes('çocuk')
  ) {
    pool = SPORTS_IMAGE_MAP.ebeveyn;
  }

  // Rastgele veya deterministik seçim
  const idx = Math.abs(t.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % pool.length;
  return pool[idx];
}

/**
 * HTML makale gövdesine responsive ve SEO uyumlu hero görseli enjekte eder.
 */
export function injectFeaturedImageToHtml(html: string, topicOrTitle: string): string {
  if (/<img\s+[^>]*src=/i.test(html)) {
    return html;
  }

  const img = getSportsImageForTopic(topicOrTitle);
  const figureHtml = `
<figure class="article-featured-media" style="margin: 0 0 1.75rem 0; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
  <img src="${img.url}" alt="${img.alt}" loading="lazy" style="width: 100%; height: auto; max-height: 440px; object-fit: cover; display: block;" />
</figure>
`.trim();

  return `${figureHtml}\n${html}`;
}
