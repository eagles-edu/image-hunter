import { buildAttribution, isAllowedLicense } from '../license.js';
import type { ImageResult, ImageSource, SourceContext } from '../types.js';

interface OpenverseImage {
  id: string;
  title?: string;
  creator?: string;
  url: string;
  thumbnail?: string;
  foreign_landing_url: string;
  license: string;
  license_url?: string;
  width?: number;
  height?: number;
}

export const openverse: ImageSource = {
  name: 'openverse',
  async search(query, limit, ctx: SourceContext): Promise<ImageResult[]> {
    const params = new URLSearchParams({
      q: query,
      license: 'cc0,pdm,by,by-sa,by-nc,by-nc-sa',
      page_size: String(limit),
    });
    const headers: Record<string, string> = { 'User-Agent': ctx.userAgent, Accept: 'application/json' };
    if (ctx.openverseToken) headers.Authorization = `Bearer ${ctx.openverseToken}`;

    const res = await fetch(`https://api.openverse.org/v1/images/?${params}`, {
      headers,
      signal: ctx.signal,
    });
    if (!res.ok) throw new Error(`Openverse HTTP ${res.status}`);

    const body = (await res.json()) as { results: OpenverseImage[] };
    const results: ImageResult[] = [];
    for (const img of body.results) {
      if (!isAllowedLicense(img.license)) continue;
      const title = img.title || 'Untitled';
      results.push({
        id: `openverse:${img.id}`,
        source: 'openverse',
        title,
        thumbUrl: img.thumbnail || img.url,
        imageUrl: img.url,
        pageUrl: img.foreign_landing_url,
        width: img.width,
        height: img.height,
        license: img.license,
        licenseUrl: img.license_url,
        creator: img.creator,
        attribution: buildAttribution({
          title,
          creator: img.creator,
          license: img.license,
          pageUrl: img.foreign_landing_url,
        }),
      });
    }
    return results;
  },
};
