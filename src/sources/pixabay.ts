import { buildAttribution } from '../license.js';
import type { ImageResult, ImageSource, SourceContext } from '../types.js';

interface PixabayHit {
  id: number;
  pageURL: string;
  webformatURL: string;
  largeImageURL: string;
  user?: string;
  tags?: string;
  imageWidth?: number;
  imageHeight?: number;
}

// Pixabay requires per_page between 3 and 200.
// Pixabay content licence: free for unaltered and altered use, attribution not required but given here.
export const pixabay: ImageSource = {
  name: 'pixabay',
  async search(query, limit, ctx: SourceContext): Promise<ImageResult[]> {
    if (!ctx.pixabayKey) throw new Error('Pixabay key missing (set PIXABAY_API_KEY)');
    const params = new URLSearchParams({
      key: ctx.pixabayKey,
      q: query,
      image_type: 'photo',
      safesearch: 'true',
      per_page: String(Math.min(200, Math.max(3, limit))),
    });
    const res = await fetch(`https://pixabay.com/api/?${params}`, {
      headers: { 'User-Agent': ctx.userAgent, Accept: 'application/json' },
      signal: ctx.signal,
    });
    if (!res.ok) throw new Error(`Pixabay HTTP ${res.status}`);

    const body = (await res.json()) as { hits?: PixabayHit[] };
    return (body.hits ?? []).map((h) => {
      const title = h.tags || 'Untitled';
      return {
        id: `pixabay:${h.id}`,
        source: 'pixabay',
        title,
        thumbUrl: h.webformatURL,
        imageUrl: h.largeImageURL,
        pageUrl: h.pageURL,
        width: h.imageWidth,
        height: h.imageHeight,
        license: 'stock',
        creator: h.user,
        attribution: buildAttribution({ title, creator: h.user, license: 'stock', pageUrl: h.pageURL }),
      };
    });
  },
};
