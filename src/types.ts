// Licence codes use Openverse naming. Non-commercial (nc) and no-derivatives (nd) are excluded
// because the slides we generate are commercial-friendly re-uses and may be modified.
export type LicenseCode = 'cc0' | 'pdm' | 'by' | 'by-sa';

export const ALLOWED_LICENSES: readonly LicenseCode[] = ['cc0', 'pdm', 'by', 'by-sa'];

export interface ImageResult {
  id: string;
  source: string;
  title: string;
  thumbUrl: string;
  imageUrl: string;
  pageUrl: string;
  width?: number;
  height?: number;
  license: LicenseCode;
  licenseUrl?: string;
  creator?: string;
  attribution: string;
}

export interface SourceContext {
  userAgent: string;
  openverseToken?: string;
  europeanaKey: string;
  signal: AbortSignal;
}

export interface ImageSource {
  name: string;
  search(query: string, limit: number, ctx: SourceContext): Promise<ImageResult[]>;
}
