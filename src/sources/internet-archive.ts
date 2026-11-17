import { buildAttribution, parseLicenseUri } from '../license.js';
import type { ImageResult, ImageSource, SourceContext } from '../types.js';

interface ArchiveDoc {
  identifier: string;
  title?: string;
  creator?: string | string[];
  licenseurl?: string | string[];
}

export const internetArchive: ImageSource = {
  name: 'internet-archive',
  async search(query, limit, ctx: SourceContext): Promise<ImageResult[]> {
    const params = new URLSearchParams({
      q: `${query} AND mediatype:image AND licenseurl:*`,
      rows: String(limit),
      output: 'json',
    });
    for (const field of ['identifier', 'title', 'creator', 'licenseurl']) params.append('fl[]', field);

    const res = await fetch(`https://archive.org/advancedsearch.php?${params}`, {
      headers: { 'User-Agent': ctx.userAgent, Accept: 'application/json' },
      signal: ctx.signal,
    });
    if (!res.ok) throw new Error(`Internet Archive HTTP ${res.status}`);

    const body = (await res.json()) as { response: { docs: ArchiveDoc[] } };
    const results: ImageResult[] = [];
    for (const doc of body.response.docs) {
      const licenseUrl = [doc.licenseurl].flat()[0];
      const license = licenseUrl ? parseLicenseUri(licenseUrl) : undefined;
      if (!license) continue;
      const title = doc.title || 'Untitled';
      const creator = [doc.creator].flat()[0];
      const pageUrl = `https://archive.org/details/${doc.identifier}`;
      const thumb = `https://archive.org/services/img/${doc.identifier}`;
      results.push({
        id: `internet-archive:${doc.identifier}`,
        source: 'internet-archive',
        title,
        thumbUrl: thumb,
        imageUrl: thumb,
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
