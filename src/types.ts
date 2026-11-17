// Licence codes use Openverse naming for Creative Commons. 'stock' covers free stock-site licences
// (Unsplash, Pexels, Pixabay) that allow unaltered use with attribution.
// Creative Commons no-derivatives (nd) is still excluded because slides may modify images.
export type LicenseCode = 'cc0' | 'pdm' | 'by' | 'by-sa' | 'by-nc' | 'by-nc-sa' | 'stock';

export const ALLOWED_LICENSES: readonly LicenseCode[] = ['cc0', 'pdm', 'by', 'by-sa', 'by-nc', 'by-nc-sa', 'stock'];

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
  unsplashKey?: string;
  pexelsKey?: string;
  pixabayKey?: string;
  signal: AbortSignal;
}

export interface ImageSource {
  name: string;
  search(query: string, limit: number, ctx: SourceContext): Promise<ImageResult[]>;
}
