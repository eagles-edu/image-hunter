import { describe, expect, it } from 'vitest';
import { parseWikimediaLicense } from '../src/license.js';
import { searchImages } from '../src/search.js';
import type { ImageResult, ImageSource } from '../src/types.js';

const img = (source: string, n: number, license: ImageResult['license'] = 'cc0'): ImageResult => ({
  id: `${source}:${n}`,
  source,
  title: `${source} ${n}`,
  thumbUrl: `https://t/${source}/${n}`,
  imageUrl: `https://i/${source}/${n}`,
  pageUrl: `https://p/${source}/${n}`,
  license,
  attribution: '',
});

const fake = (name: string, results: ImageResult[]): ImageSource => ({
  name,
  search: async () => results,
});

const failing: ImageSource = {
  name: 'broken',
  search: async () => {
    throw new Error('HTTP 503');
  },
};

const opts = { limit: 10, licenses: ['cc0', 'pdm', 'by', 'by-sa'] as const, userAgent: 'test' };

describe('parseWikimediaLicense', () => {
  it('maps open licences and rejects NC/ND variants', () => {
    expect(parseWikimediaLicense('CC BY-SA 4.0')).toBe('by-sa');
    expect(parseWikimediaLicense('CC BY 2.0')).toBe('by');
    expect(parseWikimediaLicense('Public domain')).toBe('pdm');
    expect(parseWikimediaLicense('CC0')).toBe('cc0');
    expect(parseWikimediaLicense('CC BY-NC-SA 4.0')).toBeUndefined();
    expect(parseWikimediaLicense('CC BY-ND 4.0')).toBeUndefined();
    expect(parseWikimediaLicense('GFDL')).toBeUndefined();
  });
});

describe('searchImages', () => {
  it('reports a failing source without failing the search', async () => {
    const res = await searchImages('cat', opts, [fake('a', [img('a', 1)]), failing]);
    expect(res.results.map((r) => r.id)).toEqual(['a:1']);
    expect(res.sourceErrors).toEqual({ broken: 'HTTP 503' });
  });

  it('drops results whose licence is not requested', async () => {
    const res = await searchImages(
      'cat',
      { ...opts, licenses: ['by'] },
      [fake('a', [img('a', 1, 'cc0'), img('a', 2, 'by')])],
    );
    expect(res.results.map((r) => r.id)).toEqual(['a:2']);
  });

  it('dedupes by image URL and interleaves sources round-robin', async () => {
    const res = await searchImages('cat', opts, [
      fake('a', [img('a', 1), img('a', 2), img('a', 3)]),
      fake('b', [img('b', 1), { ...img('a', 2), id: 'dup' }]),
    ]);
    expect(res.results.map((r) => r.id)).toEqual(['a:1', 'b:1', 'a:2', 'a:3']);
  });
});
