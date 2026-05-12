/**
 * JSON-LD (structured data) yardimcilari.
 * Schema.org tabanli zenginlestirilmis sonuc icin tum sayfalarda kullanilir.
 *
 * Kullanim:
 *   import { organizationSchema, websiteSchema } from '@/lib/seo/jsonld';
 *   const json = JSON.stringify([organizationSchema(), websiteSchema()]);
 *   ...
 *   <script type="application/ld+json" set:html={json} />
 */

export const SITE_URL = 'https://spornerede.net';
export const SITE_NAME = 'SporNerede.net';
export const SITE_LOGO = `${SITE_URL}/logo-spornerede.svg`;
export const SITE_OG_DEFAULT = `${SITE_URL}/og-image.png`;

const SAME_AS = [
  'https://www.instagram.com/spor.nerede/',
  'https://x.com/Spor_Nerede',
];

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    alternateName: 'Spor Nerede',
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: SITE_LOGO,
      width: 512,
      height: 512,
    },
    image: SITE_OG_DEFAULT,
    sameAs: SAME_AS,
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'info@spornerede.net',
        availableLanguage: ['tr'],
        areaServed: 'TR',
      },
    ],
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    inLanguage: 'tr-TR',
    publisher: { '@id': `${SITE_URL}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/ara?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export type BreadcrumbItem = {
  name: string;
  url: string;
};

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export type FaqEntry = {
  question: string;
  answer: string;
};

export function faqPageSchema(entries: FaqEntry[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entries.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export type SportsActivityLocationInput = {
  clubId: number | string;
  name: string;
  url: string;
  description?: string;
  branch?: string;
  emoji?: string;
  telephone?: string;
  email?: string;
  address?: string;
  streetAddress?: string;
  addressLocality?: string;
  addressRegion?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  priceRange?: string;
  image?: string | string[];
  aggregateRating?: { ratingValue: number; reviewCount: number };
};

export function sportsActivityLocationSchema(input: SportsActivityLocationInput) {
  const node: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': ['SportsActivityLocation', 'LocalBusiness'],
    '@id': `${input.url}#org`,
    name: input.name,
    url: input.url,
    inLanguage: 'tr-TR',
  };
  if (input.description) node.description = input.description;
  if (input.branch) node.sport = input.branch;
  if (input.telephone) node.telephone = input.telephone;
  if (input.email) node.email = input.email;
  if (input.priceRange) node.priceRange = input.priceRange;

  if (input.streetAddress || input.address || input.addressLocality) {
    node.address = {
      '@type': 'PostalAddress',
      streetAddress: input.streetAddress ?? input.address,
      addressLocality: input.addressLocality,
      addressRegion: input.addressRegion,
      postalCode: input.postalCode,
      addressCountry: 'TR',
    };
  }

  if (Number.isFinite(input.latitude) && Number.isFinite(input.longitude)) {
    node.geo = {
      '@type': 'GeoCoordinates',
      latitude: input.latitude,
      longitude: input.longitude,
    };
  }

  if (input.image) {
    node.image = Array.isArray(input.image) ? input.image : [input.image];
  }

  if (input.aggregateRating && input.aggregateRating.reviewCount > 0) {
    node.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: input.aggregateRating.ratingValue,
      reviewCount: input.aggregateRating.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return node;
}

export type CourseInput = {
  url: string;
  name: string;
  description?: string;
  providerName: string;
  providerUrl?: string;
  branch?: string;
  level?: string;
  price?: string;
  startDate?: string;
  endDate?: string;
  isOngoing?: boolean;
  locationText?: string;
  latitude?: number;
  longitude?: number;
  image?: string | string[];
};

export function courseSchema(input: CourseInput) {
  const node: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: input.name,
    url: input.url,
    inLanguage: 'tr-TR',
    provider: {
      '@type': 'Organization',
      name: input.providerName,
      ...(input.providerUrl ? { url: input.providerUrl } : {}),
    },
  };

  if (input.description) node.description = input.description;
  if (input.branch) node.about = input.branch;
  if (input.level) node.educationalLevel = input.level;

  // Course icin Offers (fiyat bilgisi)
  if (input.price) {
    node.offers = {
      '@type': 'Offer',
      url: input.url,
      priceCurrency: 'TRY',
      // Fiyat metni sayisal degilse Offer.price atlanir; sadece bilgi
      description: input.price,
      availability: 'https://schema.org/InStock',
    };
  }

  // CourseInstance — egitim donemi bilgisi varsa
  const hasSchedule = input.startDate || input.isOngoing;
  if (hasSchedule) {
    const courseInstance: Record<string, unknown> = {
      '@type': 'CourseInstance',
      courseMode: 'offline',
    };
    if (input.startDate) courseInstance.startDate = input.startDate;
    if (input.endDate) courseInstance.endDate = input.endDate;
    if (input.locationText) {
      courseInstance.location = {
        '@type': 'Place',
        name: input.locationText,
        ...(Number.isFinite(input.latitude) && Number.isFinite(input.longitude)
          ? {
              geo: {
                '@type': 'GeoCoordinates',
                latitude: input.latitude,
                longitude: input.longitude,
              },
            }
          : {}),
      };
    }
    node.hasCourseInstance = courseInstance;
  }

  if (input.image) {
    node.image = Array.isArray(input.image) ? input.image : [input.image];
  }

  return node;
}

export type ItemListEntry = {
  url: string;
  name: string;
};

export function itemListSchema(items: ItemListEntry[], options?: { name?: string; description?: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: options?.name,
    description: options?.description,
    numberOfItems: items.length,
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: item.url,
      name: item.name,
    })),
  };
}

/** JSON-LD scriptini tek bir array olarak sayfaya basmak icin yardimci */
export function jsonLdScript(nodes: unknown | unknown[]): string {
  const value = Array.isArray(nodes) ? nodes : [nodes];
  // Schema.org tarafinda undefined alanlari at
  return JSON.stringify(value, (_key, val) => (val === undefined ? undefined : val));
}
