import { ALLOWED_LICENSES, type LicenseCode } from './types.js';

const LICENSE_LABELS: Record<LicenseCode, string> = {
  cc0: 'CC0 1.0 (public domain dedication)',
  pdm: 'Public Domain Mark',
  by: 'CC BY',
  'by-sa': 'CC BY-SA',
};

export function isAllowedLicense(code: string): code is LicenseCode {
  return (ALLOWED_LICENSES as readonly string[]).includes(code);
}

// Wikimedia reports free-form short names such as "CC BY-SA 4.0" or "Public domain".
export function parseWikimediaLicense(shortName: string): LicenseCode | undefined {
  const name = shortName.trim();
  if (/^CC0\b/i.test(name)) return 'cc0';
  if (/^public domain/i.test(name) || /^PD\b/.test(name)) return 'pdm';
  if (/\b(NC|ND)\b/i.test(name)) return undefined;
  if (/^CC BY-SA\b/i.test(name)) return 'by-sa';
  if (/^CC BY\b/i.test(name)) return 'by';
  return undefined;
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
