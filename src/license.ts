import { ALLOWED_LICENSES, type LicenseCode } from './types.js';

const LICENSE_LABELS: Record<LicenseCode, string> = {
  cc0: 'CC0 1.0 (public domain dedication)',
  pdm: 'Public Domain Mark',
  by: 'CC BY',
  'by-sa': 'CC BY-SA',
  'by-nc': 'CC BY-NC',
  'by-nc-sa': 'CC BY-NC-SA',
  stock: 'free stock licence',
};

export function isAllowedLicense(code: string): code is LicenseCode {
  return (ALLOWED_LICENSES as readonly string[]).includes(code);
}

// Wikimedia reports free-form short names such as "CC BY-SA 4.0" or "Public domain".
export function parseWikimediaLicense(shortName: string): LicenseCode | undefined {
  const name = shortName.trim();
  if (/^CC0\b/i.test(name)) return 'cc0';
  if (/^public domain/i.test(name) || /^PD\b/.test(name)) return 'pdm';
  if (/\bND\b/i.test(name)) return undefined;
  if (/^CC BY-NC-SA\b/i.test(name)) return 'by-nc-sa';
  if (/^CC BY-NC\b/i.test(name)) return 'by-nc';
  if (/^CC BY-SA\b/i.test(name)) return 'by-sa';
  if (/^CC BY\b/i.test(name)) return 'by';
  return undefined;
}

// Sources such as Internet Archive and Europeana report licences as CC URIs.
// ND licences return undefined.
export function parseLicenseUri(uri: string): LicenseCode | undefined {
  if (/creativecommons\.org\/publicdomain\/zero\//i.test(uri)) return 'cc0';
  if (/creativecommons\.org\/publicdomain\/mark\//i.test(uri)) return 'pdm';
  const m = uri.match(/creativecommons\.org\/licenses\/(by(?:-nc)?(?:-nd|-sa)?)\//i);
  if (!m) return undefined;
  const code = m[1].toLowerCase();
  return ALLOWED_LICENSES.find((l) => l === code);
}

export function buildAttribution(input: {
  title: string;
  creator?: string;
  license: LicenseCode;
  pageUrl: string;
}): string {
  const by = input.creator ? ` by ${input.creator}` : '';
  return `"${input.title}"${by}, ${LICENSE_LABELS[input.license]}. Source: ${input.pageUrl}`;
}
