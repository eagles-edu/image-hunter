import { fileURLToPath } from 'node:url';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { isAllowedLicense } from './license.js';
import { searchImages } from './search.js';
import { ALLOWED_LICENSES } from './types.js';

export interface AppConfig {
  userAgent: string;
  openverseToken?: string;
  europeanaKey?: string;
}

export function buildServer(config: AppConfig) {
  const app = Fastify({ logger: true });

  app.get('/api/health', async () => ({ ok: true }));

  app.get<{ Querystring: { q?: string; limit?: string; license?: string } }>(
    '/api/search',
    async (req, reply) => {
      const q = (req.query.q ?? '').trim();
      if (q.length < 2 || q.length > 200) {
        return reply.code(400).send({ error: 'q must be 2-200 characters' });
      }

      const limit = Number(req.query.limit ?? 20);
      if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
        return reply.code(400).send({ error: 'limit must be an integer from 1 to 50' });
      }

      const requested = req.query.license
        ? req.query.license.split(',').map((s) => s.trim())
        : [...ALLOWED_LICENSES];
      const licenses = requested.filter(isAllowedLicense);
      if (licenses.length === 0 || licenses.length !== requested.length) {
        return reply.code(400).send({ error: `license must be a subset of ${ALLOWED_LICENSES.join(',')}` });
      }

      return searchImages(q, { limit, licenses, ...config });
    },
  );

  app.register(fastifyStatic, { root: fileURLToPath(new URL('../public/', import.meta.url)) });

  app.setNotFoundHandler((req, reply) => {
    if (req.url.startsWith('/api/')) {
      return reply.code(404).send({ error: `no such API route: ${req.method} ${req.url.split('?')[0]}` });
    }
    return reply.code(404).type('text/plain').send('Not found');
  });

  return app;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const app = buildServer({
    userAgent: process.env.USER_AGENT ?? 'image-hunter-poc/0.1',
    openverseToken: process.env.OPENVERSE_TOKEN || undefined,
    europeanaKey: process.env.EUROPEANA_KEY || undefined,
  });
  await app.listen({
    port: Number(process.env.PORT ?? 3100),
    host: process.env.HOST ?? '127.0.0.1',
  });
}
