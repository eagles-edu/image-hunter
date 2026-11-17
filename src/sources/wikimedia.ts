import { buildAttribution, parseWikimediaLicense } from '../license.js';
import type { ImageResult, ImageSource, SourceContext } from '../types.js';

interface Meta {
  value: string;
}

interface CommonsPage {
  pageid: number;
  title: string;
  imageinfo?: Array<{
    url: string;
    descriptionurl: string;
    thumburl?: string;
    width?: number;
    height?: number;
    extmetadata?: Record<string, Meta>;
  }>;
}

const stripHtml = (s: string): string => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

export const wikimedia: ImageSource = {
  name: 'wikimedia',
  async search(query, limit, ctx: SourceContext): Promise<ImageResult[]> {
    const params = new URLSearchParams({
      action: 'query',
      generator: 'search',
      gsrnamespace: '6',
      gsrsearch: `${query} filetype:bitmap`,
      gsrlimit: String(limit),
      prop: 'imageinfo',
      iiprop: 'url|size|extmetadata',
      iiurlwidth: '800',
      iiextmetadatafilter: 'LicenseShortName|LicenseUrl|Artist|Restrictions',
      format: 'json',
    });
    const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
      headers: { 'User-Agent': ctx.userAgent, Accept: 'application/json' },
      signal: ctx.signal,
    });
    if (!res.ok) throw new Error(`Wikimedia HTTP ${res.status}`);

    const body = (await res.json()) as { query?: { pages?: Record<string, CommonsPage> } };
    const pages = Object.values(body.query?.pages ?? {});
    const results: ImageResult[] = [];

    for (const page of pages) {
      const info = page.imageinfo?.[0];
      if (!info) continue;
      const meta = info.extmetadata ?? {};
      // A Restrictions field means extra conditions (trademarks, personality rights): skip rather than guess.
      if (meta.Restrictions?.value) continue;

      const license = parseWikimediaLicense(meta.LicenseShortName?.value ?? '');
      if (!license) continue;

      const title = page.title.replace(/^File:/, '').replace(/_/g, ' ');
      const creator = meta.Artist ? stripHtml(meta.Artist.value) : undefined;
      results.push({
        id: `wikimedia:${page.pageid}`,
        source: 'wikimedia',
        title,
        thumbUrl: info.thumburl || info.url,
        imageUrl: info.url,
        pageUrl: info.descriptionurl,
        width: info.width,
        height: info.height,
        license,
        licenseUrl: meta.LicenseUrl?.value,
        creator,
        attribution: buildAttribution({ title, creator, license, pageUrl: info.descriptionurl }),
      });
    }
    return results;
  },
};
