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
    const server = await app();
    const host = process.env['HOST'] || '0.0.0.0';
    const port = +(process.env['PORT'] || 4200);
    await server.listen({host, port});
    console.log(`Listening on http://localhost:${port}`);
  })();
}

// For serverless / cloud-function usage
export const reqHandler = createNodeRequestHandler(async (req, res) => {
  const server = await app();
  await server.ready();
  server.server.emit('request', req, res);
});
