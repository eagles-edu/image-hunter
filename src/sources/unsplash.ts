import { buildAttribution } from '../license.js';
import type { ImageResult, ImageSource, SourceContext } from '../types.js';

interface UnsplashPhoto {
  id: string;
  description?: string | null;
  alt_description?: string | null;
  width?: number;
  height?: number;
  urls: { small: string; regular: string };
  links: { html: string };
  user: { name: string };
}

// Unsplash licence: free to use; attribution is requested and given here. Needs UNSPLASH_ACCESS_KEY.
export const unsplash: ImageSource = {
  name: 'unsplash',
  async search(query, limit, ctx: SourceContext): Promise<ImageResult[]> {
    if (!ctx.unsplashKey) throw new Error('Unsplash key missing (set UNSPLASH_ACCESS_KEY)');
    const params = new URLSearchParams({ query, per_page: String(limit) });
    const res = await fetch(`https://api.unsplash.com/search/photos?${params}`, {
      headers: {
        Authorization: `Client-ID ${ctx.unsplashKey}`,
        'Accept-Version': 'v1',
        'User-Agent': ctx.userAgent,
        Accept: 'application/json',
      },
      signal: ctx.signal,
    });
    if (!res.ok) throw new Error(`Unsplash HTTP ${res.status}`);

    const body = (await res.json()) as { results?: UnsplashPhoto[] };
    return (body.results ?? []).map((p) => {
      const title = p.description || p.alt_description || 'Untitled';
      return {
        id: `unsplash:${p.id}`,
        source: 'unsplash',
        title,
        thumbUrl: p.urls.small,
        imageUrl: p.urls.regular,
        pageUrl: p.links.html,
        width: p.width,
        height: p.height,
        license: 'stock',
        creator: p.user.name,
        attribution: buildAttribution({ title, creator: p.user.name, license: 'stock', pageUrl: p.links.html }),
      };
    });
  },
};
