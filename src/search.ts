import type { ImageResult, ImageSource, LicenseCode, SourceContext } from './types.js';
import { sources as defaultSources } from './sources/index.js';

export interface SearchOptions {
  limit: number;
  licenses: readonly LicenseCode[];
  userAgent: string;
  openverseToken?: string;
  timeoutMs?: number;
}

export interface SearchResponse {
  query: string;
  results: ImageResult[];
  sourceErrors: Record<string, string>;
}

// One failing source must not fail the whole search, so results are gathered with allSettled.
// Results are interleaved round-robin so no single source dominates the page.
export async function searchImages(
  query: string,
  opts: SearchOptions,
  sources: ImageSource[] = defaultSources,
): Promise<SearchResponse> {
  const ctx: SourceContext = {
    userAgent: opts.userAgent,
    openverseToken: opts.openverseToken,
    signal: AbortSignal.timeout(opts.timeoutMs ?? 20000),
  };

  const settled = await Promise.allSettled(sources.map((s) => s.search(query, opts.limit, ctx)));

  const sourceErrors: Record<string, string> = {};
  const buckets: ImageResult[][] = [];
  settled.forEach((outcome, i) => {
    if (outcome.status === 'rejected') {
      sourceErrors[sources[i].name] = String(outcome.reason?.message ?? outcome.reason);
      return;
    }
    buckets.push(outcome.value.filter((img) => opts.licenses.includes(img.license)));
  });

  const seen = new Set<string>();
  const results: ImageResult[] = [];
  const longest = Math.max(0, ...buckets.map((b) => b.length));
  for (let i = 0; i < longest && results.length < opts.limit; i++) {
    for (const bucket of buckets) {
      const img = bucket[i];
      if (!img || seen.has(img.imageUrl)) continue;
      seen.add(img.imageUrl);
      results.push(img);
      if (results.length >= opts.limit) break;
    }
  }

  return { query, results, sourceErrors };
}
