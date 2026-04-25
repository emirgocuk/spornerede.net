export const PROGRAM_CONTENT_PREFIX = '__SN_PROGRAM_CONTENT_V1__';

export type ProgramContentModel = {
  summary: string;
  eventDate: string;
  locationText: string;
  gallery: string[];
  bodyJson: unknown | null;
};

export const EMPTY_PROGRAM_CONTENT: ProgramContentModel = {
  summary: '',
  eventDate: '',
  locationText: '',
  gallery: [],
  bodyJson: null,
};

export function parseProgramContent(rawValue: string | undefined | null) {
  const raw = (rawValue ?? '').trim();
  if (!raw) {
    return { content: { ...EMPTY_PROGRAM_CONTENT }, legacyText: '' };
  }
  if (!raw.startsWith(PROGRAM_CONTENT_PREFIX)) {
    return {
      content: { ...EMPTY_PROGRAM_CONTENT, summary: raw },
      legacyText: raw,
    };
  }
  const jsonPart = raw.slice(PROGRAM_CONTENT_PREFIX.length);
  try {
    const parsed = JSON.parse(jsonPart) as Partial<ProgramContentModel>;
    return {
      content: {
        summary: typeof parsed.summary === 'string' ? parsed.summary : '',
        eventDate: typeof parsed.eventDate === 'string' ? parsed.eventDate : '',
        locationText: typeof parsed.locationText === 'string' ? parsed.locationText : '',
        gallery: Array.isArray(parsed.gallery)
          ? parsed.gallery.filter((item): item is string => typeof item === 'string')
          : [],
        bodyJson: parsed.bodyJson ?? null,
      },
      legacyText: '',
    };
  } catch {
    return { content: { ...EMPTY_PROGRAM_CONTENT, summary: raw }, legacyText: raw };
  }
}

export function serializeProgramContent(contentInput: Partial<ProgramContentModel>) {
  const content: ProgramContentModel = {
    summary: (contentInput.summary ?? '').trim(),
    eventDate: (contentInput.eventDate ?? '').trim(),
    locationText: (contentInput.locationText ?? '').trim(),
    gallery: Array.isArray(contentInput.gallery)
      ? contentInput.gallery
          .filter((item): item is string => typeof item === 'string')
          .map((item) => item.trim())
          .filter(Boolean)
      : [],
    bodyJson: contentInput.bodyJson ?? null,
  };
  return `${PROGRAM_CONTENT_PREFIX}${JSON.stringify(content)}`;
}
