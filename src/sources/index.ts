import type { ImageSource } from '../types.js';
import { openverse } from './openverse.js';
import { wikimedia } from './wikimedia.js';

// Sources with a verified public API and per-item licence data. Curated sites without an API
// (see data/catalog.json) are intentionally not included.
export const sources: ImageSource[] = [openverse, wikimedia];
