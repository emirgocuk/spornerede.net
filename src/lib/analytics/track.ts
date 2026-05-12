/**
 * SporNerede.net — Tracking event helpers (browser-side).
 *
 * Tum event'ler GTM dataLayer'a push edilir. Consent Mode v2 ile uyumlu
 * (consent reddedildiyse GTM tag'lari kendileri filtreler).
 *
 * Ayrica server-side first-party log icin /api/internal/track endpoint'ine
 * beacon gonderir. Bu, cookie'siz tarayicilarda ve GA4 outage'larinda veri
 * kaybini azaltir.
 */

type TrackParams = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    spornereedeTrack?: (event: string, params?: TrackParams) => void;
  }
}

function pushDataLayer(event: string, params?: TrackParams) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...(params ?? {}) });
}

function sendServerBeacon(event: string, params?: TrackParams) {
  if (typeof window === 'undefined') return;
  try {
    const payload = JSON.stringify({
      event,
      params: params ?? {},
      page: window.location.pathname + window.location.search,
      referrer: document.referrer || null,
      timestamp: Date.now(),
    });
    // sendBeacon: sayfa kapanirken bile gonderir
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/internal/track', new Blob([payload], { type: 'application/json' }));
    } else {
      fetch('/api/internal/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // ignore — analytics fail kullaniciyi etkilememeli
  }
}

/** Genel track API. */
export function track(event: string, params?: TrackParams) {
  pushDataLayer(event, params);
  sendServerBeacon(event, params);
}

// 10 ana conversion event'i ve kisa wrapper'lar
export const events = {
  viewListing: (listingId: number | string, branch?: string, city?: string) =>
    track('view_listing', { listing_id: listingId, branch, city }),

  viewClub: (clubId: number | string, branch?: string, city?: string) =>
    track('view_club', { club_id: clubId, branch, city }),

  searchPerformed: (filters: { il?: string; ilce?: string; brans?: string; resultCount?: number }) =>
    track('search_performed', { ...filters }),

  leadPhoneClick: (clubId?: number | string, listingId?: number | string) =>
    track('lead_phone_click', { club_id: clubId, listing_id: listingId }),

  leadEmailClick: (clubId?: number | string, listingId?: number | string) =>
    track('lead_email_click', { club_id: clubId, listing_id: listingId }),

  leadMapsClick: (clubId?: number | string, listingId?: number | string) =>
    track('lead_maps_click', { club_id: clubId, listing_id: listingId }),

  applicationSubmit: () => track('application_submit'),
  applicationSuccess: () => track('application_success'),

  contactFormSubmit: () => track('contact_form_submit'),
  feedbackSubmit: () => track('feedback_submit'),
};
