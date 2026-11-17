import type { ImageSource } from '../types.js';
import { europeana } from './europeana.js';
import { internetArchive } from './internet-archive.js';
import { met } from './met.js';
import { openverse } from './openverse.js';
import { pexels } from './pexels.js';
import { pixabay } from './pixabay.js';
import { unsplash } from './unsplash.js';
import { wikimedia } from './wikimedia.js';

// Sources with a verified public API and per-item licence data. Curated sites without an API
// (see data/catalog.json) are intentionally not included. Stock sites need an API key each.
export const sources: ImageSource[] = [
  openverse,
  wikimedia,
  met,
  internetArchive,
  europeana,
  unsplash,
  pexels,
  pixabay,
];
