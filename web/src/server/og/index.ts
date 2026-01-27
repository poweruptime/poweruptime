import {s_cut} from 'dfts-helper';
import type {FastifyPluginAsync} from 'fastify';

import {BackendType} from '@app/api';
import {environment} from '@app/util';

import {ImageResponse} from './render-to-image';

const fontFile = await fetch('https://og-playground.vercel.app/inter-latin-ext-700-normal.woff');
const fontData: ArrayBuffer = await fontFile.arrayBuffer();

const og: FastifyPluginAsync = async (fastify, _opts): Promise<void> => {
  fastify.get<{Querystring: {slug: string}}>('/status-page', async (_request, reply) => {
    const slug = _request.query.slug;

    let statusPage: BackendType['PublicStatusPageResponse'];

    try {
      statusPage = await fetch(`${environment.backendHost}/api/v1/public/status-page/${slug}`).then(
        (it) => it.json(),
      );
    } catch (e) {
      console.error(e);
      throw new Error(`Could not load status page: ${slug}`);
    }

    const statusPageStatus = statusPage.groups
      .flatMap((it) => it.monitors)
      .some((it) => it.status === 'DOWN')
      ? ('DOWN' as const)
      : ('UP' as const);

    const statusPageImageUrl = statusPage.image
      ? `${process.env['POWERUPTIME_HOST'] ?? environment.backendHost}/api/v1/public/file/${statusPage.image.fileId}`
      : undefined;

    const template = `
      <div tw="bg-gray-50 flex flex-col w-full h-full justify-between p-5">
        <div tw="flex flex-col items-center justify-center">
          ${statusPageImageUrl ? ` <img src="${statusPageImageUrl}" height={"70%"} /> ` : '<div tw="flex h-40"></div>'}
        </div>
        <div tw="flex flex-col">
          <span tw="text-6xl">${statusPage.name}</span>
          ${
            (statusPage.description?.length ?? 0 > 0)
              ? `<span tw="text-lg">${s_cut(statusPage.description, 100)}</span>`
              : '<span tw="flex h-6"></span>'
          }
          <div tw="flex justify-between items-center">
            <div tw="${statusPageStatus === 'UP' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'} p-3 rounded-lg text-lg">
              ${statusPageStatus === 'UP' ? 'All services operational' : 'Some services experience issues'}
            </div>
            <span>by poweruptime</span>
          </div>
        </div>
      </div>
    `;

    return new ImageResponse(template, {
      fonts: [
        {
          name: 'Inter Latin',
          data: fontData,
          style: 'normal',
        },
      ],
    });
  });
};

export default og;
