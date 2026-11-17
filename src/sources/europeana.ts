import { buildAttribution, parseLicenseUri } from '../license.js';
import type { ImageResult, ImageSource, SourceContext } from '../types.js';

interface EuropeanaItem {
  guid: string;
  title?: string[];
  dcCreator?: string[];
  rights?: string[];
  edmPreview?: string[];
  edmIsShownBy?: string[];
}

export const europeana: ImageSource = {
  name: 'europeana',
  async search(query, limit, ctx: SourceContext): Promise<ImageResult[]> {
    const params = new URLSearchParams({
      wskey: ctx.europeanaKey,
      query,
      reusability: 'open',
      qf: 'TYPE:IMAGE',
      media: 'true',
      rows: String(limit),
    });
    const res = await fetch(`https://api.europeana.eu/record/v2/search.json?${params}`, {
      headers: { 'User-Agent': ctx.userAgent, Accept: 'application/json' },
      signal: ctx.signal,
    });
    if (!res.ok) throw new Error(`Europeana HTTP ${res.status}`);

    const body = (await res.json()) as { items?: EuropeanaItem[] };
    const results: ImageResult[] = [];
    for (const item of body.items ?? []) {
      const licenseUrl = item.rights?.find((r) => parseLicenseUri(r));
      const license = licenseUrl ? parseLicenseUri(licenseUrl) : undefined;
      const thumb = item.edmPreview?.[0];
      const full = item.edmIsShownBy?.[0] || thumb;
      if (!license || !full || !thumb) continue;
      const title = item.title?.[0] || 'Untitled';
      const creator = item.dcCreator?.[0];
      const pageUrl = item.guid;
      results.push({
        id: `europeana:${item.guid}`,
        source: 'europeana',
        title,
        thumbUrl: thumb,
        imageUrl: full,
        pageUrl,
        license,
        licenseUrl,
        creator,
        attribution: buildAttribution({ title, creator, license, pageUrl }),
      });
    }
    return results;
  },
};
