import { buildAttribution } from '../license.js';
import type { ImageResult, ImageSource, SourceContext } from '../types.js';

interface PexelsPhoto {
  id: number;
  url: string;
  photographer?: string;
  alt?: string;
  width?: number;
  height?: number;
  src: { medium: string; original: string };
}

// Pexels licence: free to use, no attribution required but given here. Needs PEXELS_API_KEY.
export const pexels: ImageSource = {
  name: 'pexels',
  async search(query, limit, ctx: SourceContext): Promise<ImageResult[]> {
    if (!ctx.pexelsKey) throw new Error('Pexels key missing (set PEXELS_API_KEY)');
    const params = new URLSearchParams({ query, per_page: String(limit) });
    const res = await fetch(`https://api.pexels.com/v1/search?${params}`, {
      headers: { Authorization: ctx.pexelsKey, 'User-Agent': ctx.userAgent, Accept: 'application/json' },
      signal: ctx.signal,
    });
    if (!res.ok) throw new Error(`Pexels HTTP ${res.status}`);

    const body = (await res.json()) as { photos?: PexelsPhoto[] };
    return (body.photos ?? []).map((p) => {
      const title = p.alt || 'Untitled';
      return {
        id: `pexels:${p.id}`,
        source: 'pexels',
        title,
        thumbUrl: p.src.medium,
        imageUrl: p.src.original,
        pageUrl: p.url,
        width: p.width,
        height: p.height,
        license: 'stock',
        creator: p.photographer,
        attribution: buildAttribution({ title, creator: p.photographer, license: 'stock', pageUrl: p.url }),
      };
    });
  },
};
