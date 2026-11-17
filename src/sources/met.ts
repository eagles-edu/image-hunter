import type { ImageResult, ImageSource, SourceContext } from '../types.js';
import { buildAttribution } from '../license.js';

interface MetObject {
  objectID: number;
  isPublicDomain: boolean;
  primaryImage?: string;
  primaryImageSmall?: string;
  title?: string;
  artistDisplayName?: string;
  objectURL: string;
  objectDate?: string;
  width?: number;
  height?: number;
}

const BASE = 'https://collectionapi.metmuseum.org/public/collection';

// The Met publishes public-domain images under CC0, so only isPublicDomain objects with an image are kept.
// Detail requests are capped because each object needs its own call.
export const met: ImageSource = {
  name: 'met',
  async search(query, limit, ctx: SourceContext): Promise<ImageResult[]> {
    const headers = { 'User-Agent': ctx.userAgent, Accept: 'application/json' };
    const params = new URLSearchParams({ q: query, hasImages: 'true' });
    const searchRes = await fetch(`${BASE}/v1.1/search?${params}`, { headers, signal: ctx.signal });
    if (!searchRes.ok) throw new Error(`Met HTTP ${searchRes.status}`);
    const { objectIDs } = (await searchRes.json()) as { objectIDs: number[] | null };
    const ids = (objectIDs ?? []).slice(0, Math.min(limit * 2, 20));

    const objects = await Promise.all(
      ids.map(async (id) => {
        const res = await fetch(`${BASE}/v1/objects/${id}`, { headers, signal: ctx.signal });
        return res.ok ? ((await res.json()) as MetObject) : undefined;
      }),
    );

    const results: ImageResult[] = [];
    for (const obj of objects) {
      if (!obj?.isPublicDomain || !obj.primaryImage) continue;
      const title = obj.title || 'Untitled';
      results.push({
        id: `met:${obj.objectID}`,
        source: 'met',
        title,
        thumbUrl: obj.primaryImageSmall || obj.primaryImage,
        imageUrl: obj.primaryImage,
        pageUrl: obj.objectURL,
        width: obj.width,
        height: obj.height,
        license: 'cc0',
        licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
        creator: obj.artistDisplayName || undefined,
        attribution: buildAttribution({
          title,
          creator: obj.artistDisplayName || undefined,
          license: 'cc0',
          pageUrl: obj.objectURL,
        }),
      });
      if (results.length >= limit) break;
    }
    return results;
  },
};
