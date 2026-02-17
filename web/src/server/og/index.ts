/* eslint-disable @typescript-eslint/no-empty-object-type */
import {format} from 'date-fns';
import {s_cut} from 'dfts-helper';
import {type Request, type Response, Router} from 'express';

import {BackendType} from '@app/api';
import {environment} from '@app/util';

import {sendImageResponse} from './render-to-image';

const fontData: ArrayBuffer = await fetch(
  'https://og-playground.vercel.app/inter-latin-ext-700-normal.woff',
).then((r) => r.arrayBuffer());

const fonts = [{name: 'Inter Latin', data: fontData, style: 'normal' as const}];

const sendImage = (template: string, res: Response) => sendImageResponse(template, res, {fonts});

const statusBadge = (isUp: boolean, label: string) =>
  `<div tw="${isUp ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'} p-7 rounded-lg text-5xl">${label}</div>`;

const ogRouter = Router();

ogRouter.get('/status-page', async (req: Request<{}, {}, {}, {slug?: string}>, res: Response) => {
  const {slug} = req.query;
  if (!slug) return void res.status(400).send('Missing slug');

  let statusPage: BackendType['PublicStatusPageResponse'];
  try {
    statusPage = await fetch(`${environment.backendHost}/api/v1/public/status-page/${slug}`).then(
      (r) => r.json(),
    );
  } catch (e) {
    console.error(e);
    return void res.status(500).send(`Could not load status page: ${slug}`);
  }

  const isUp = !statusPage.groups.flatMap((g) => g.monitors).some((m) => m.status === 'DOWN');

  const imageUrl = statusPage.image
    ? `${environment.backendHost}/api/v1/public/file/${statusPage.image.fileId}`
    : null;

  await sendImage(
    `<div tw="bg-gray-50 flex flex-col w-full h-full justify-between p-5">
        <div tw="flex items-start justify-between">
        <div tw="flex flex-col">
          <span tw="text-9xl mt-3">${statusPage.name}</span>
          ${(statusPage.description?.length ?? 0) > 0 ? `<span tw="text-lg">${s_cut(statusPage.description, 100)}</span>` : '<span tw="flex h-6"></span>'}
        </div>
          ${imageUrl && `<img src="${imageUrl}" height="60%" />`}
        </div>
        <div tw="flex flex-col">
          <div tw="flex justify-between items-center">
            ${statusBadge(isUp, isUp ? 'All services operational' : 'Some services experience issues')}
            <span tw="text-3xl">by poweruptime</span>
          </div>
        </div>
      </div>`,
    res,
  );
});

ogRouter.get('/monitor', async (req: Request<{}, {}, {}, {id?: string}>, res: Response) => {
  const {id: monitorId} = req.query;
  if (!monitorId) return void res.status(400).send('Missing id');

  let monitor: BackendType['PublicMonitorResponse'];
  try {
    monitor = await fetch(`${environment.backendHost}/api/v1/public/monitor/${monitorId}`).then(
      (r) => r.json(),
    );
  } catch (e) {
    console.error(e);
    return void res.status(500).send(`Could not load monitor: ${monitorId}`);
  }

  const lastCheckResults = monitor.lastCheckResults.slice(0, 29);
  const lastCheckResultTime =
    lastCheckResults.length > 9 ? format(lastCheckResults.at(-1)!.createdAt, 'HH:mm') : '';
  const isUp = monitor.status === 'UP';

  await sendImage(
    `<div tw="bg-gray-50 flex flex-col w-full h-full justify-between p-5">
        <div tw="flex flex-col">
          <div tw="flex items-center justify-between">
            <span tw="text-6xl">${monitor.name}</span>
            ${statusBadge(isUp, isUp ? monitor.statistics.uptime.oneDay : monitor.status)}
          </div>
          ${(monitor.description?.length ?? 0) > 0 ? `<span tw="text-3xl">${s_cut(monitor.description, 100)}</span>` : ''}
        </div>
        <div tw="flex flex-col items-center justify-center">
          <div tw="flex h-32"></div>
        </div>
        <div tw="flex justify-between items-end">
          <div tw="flex flex-col">
            <div tw="flex items-center">
              ${lastCheckResults.map((it) => `<div tw="flex mr-3 rounded-xl h-18 w-7 ${it.status === 'UP' ? 'bg-emerald-700' : 'bg-red-600'}"></div>`).join('')}
            </div>
            <div tw="flex justify-between mt-4 text-3xl">
              <span>Latest</span>
              <span tw="pr-2">${lastCheckResultTime}</span>
            </div>
          </div>
        </div>
      </div>`,
    res,
  );
});

export default ogRouter;
