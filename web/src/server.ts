import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';

import fastifyProxy from '@fastify/http-proxy';
import fastifyStatic from '@fastify/static';
import fastify from 'fastify';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

import {environment} from '@app/util';

export async function app() {
  const server = fastify();

  server.register(fastifyProxy, {
    upstream: `${environment.backendHost}/api`,
    prefix: '/api',
    http2: false,
  });

  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  server.register(fastifyStatic, {
    root: browserDistFolder,
    wildcard: false,
    cacheControl: false,
    setHeaders: (res, pathName) => {
      if (/index\.html$/.test(pathName)) {
        // no cache for index.html
        res.setHeader(
          'Cache-Control',
          'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        );
      } else if (/\.json$/.test(pathName)) {
        // no cache for .json
        res.setHeader(
          'Cache-Control',
          'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        );
      } else if (/\.(css|js)$/.test(pathName)) {
        // one year for css/js
        res.setHeader('Cache-Control', 'public, max-age=31449600');
      } else {
        // fallback: 3 days
        res.setHeader('Cache-Control', 'public, max-age=259200');
      }
    },
  });

  server.get('*', async (req, reply) => {
    try {
      const engine = new AngularNodeAppEngine();
      const response = await engine.handle(req.raw, {server: 'fastify'});
      if (response) {
        await writeResponseToNodeResponse(response, reply.raw);
      } else {
        reply.callNotFound();
      }
    } catch (err) {
      reply.send(err);
    }
  });

  return server;
}

if (isMainModule(import.meta.url)) {
  (async () => {
    const host = process.env['HOST'] || '0.0.0.0';
    const ports = [4200, 80]; // Add as many as you need

    for (const port of ports) {
      const server = await app();
      try {
        await server.listen({ host, port });
        // noinspection HttpUrlsUsage
        console.log(
          `✅ Listening on http://${host}:${port}; backendHost: "${environment.backendHost}"`,
        );
      } catch (err) {
        console.error(`❌ Failed to start server on port ${port}:`, err);
      }
    }
  })();
}

// For serverless / cloud-function usage
export const reqHandler = createNodeRequestHandler(async (req, res) => {
  const server = await app();
  await server.ready();
  server.server.emit('request', req, res);
});
