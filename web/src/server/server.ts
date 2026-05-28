import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';

import express, {type Request, type Response} from 'express';
import {createProxyMiddleware} from 'http-proxy-middleware';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

import {BACKEND_API_URL, environment} from '@app/util';

import og from './og';

const allowedHostsSet = new Set(['127.0.0.1', '127.0.0.1:4200', 'localhost:4200', 'localhost']);

const PU_HOST = process.env['POWERUPTIME_HOST'];
const DOMAIN_NAMES = process.env['DOMAIN_NAMES'];

if (PU_HOST) {
  allowedHostsSet.add(PU_HOST);
}

if (DOMAIN_NAMES) {
  [...DOMAIN_NAMES.matchAll(/Host\(`([^`]+)`\)/g)]
    .map((match) => match[1])
    .forEach((host) => allowedHostsSet.add(host));
}

const allowedHosts = [...allowedHostsSet];

console.log(`Allowed hosts: ${allowedHosts.map((it) => `"${it}"`).join(', ')}`);

export async function app() {
  const server = express();

  const logLevel = process.env['LOG_LEVEL'];

  server.use(
    '/api',
    createProxyMiddleware({
      target: environment.backendHost + BACKEND_API_URL,
      changeOrigin: true,
      logger: logLevel === 'DEBUG' ? console : undefined,
    }),
  );

  server.use('/bff/v1/og', og);

  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');

  server.use(
    express.static(browserDistFolder, {
      setHeaders: (res, pathName) => {
        if (/index\.html$/.test(pathName)) {
          res.setHeader(
            'Cache-Control',
            'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          );
        } else if (/\.json$/.test(pathName)) {
          res.setHeader(
            'Cache-Control',
            'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          );
        } else if (/\.(css|js)$/.test(pathName)) {
          res.setHeader('Cache-Control', 'public, max-age=31449600');
        } else {
          res.setHeader('Cache-Control', 'public, max-age=259200');
        }
      },
    }),
  );

  server.all(/.*/, async (req: Request, res: Response) => {
    try {
      const engine = new AngularNodeAppEngine({allowedHosts});
      const response = await engine.handle(req, {server: 'express'});

      if (response) {
        await writeResponseToNodeResponse(response, res);
      } else {
        res.status(404).end();
      }
    } catch (err) {
      console.error(err);
      res.status(500).send(err);
    }
  });

  return server;
}

if (isMainModule(import.meta.url)) {
  (async () => {
    const host = process.env['HOST'] ?? '0.0.0.0';
    const ports = [4200, 80];

    await Promise.all(
      ports.map(async (port) => {
        const server = await app();
        try {
          server.listen(port, host, () => {
            console.log(
              `Listening on http://${host}:${port}; backendHost: "${environment.backendHost}"`,
            );
          });
        } catch (err) {
          console.error(`Failed to start server on port ${port}:`, err);
        }
      }),
    );
  })();
}

export const reqHandler = createNodeRequestHandler(async (req, res) => {
  const server = await app();
  server(req, res);
});
