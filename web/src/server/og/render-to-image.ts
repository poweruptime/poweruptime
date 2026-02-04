import {Resvg} from '@resvg/resvg-wasm';
import type {Response as ExpressResponse} from 'express';
import satori, {SatoriOptions} from 'satori';
import {html as toReactElement} from 'satori-html';

export interface ImageResponseOptions {
  width?: number;
  height?: number;
  fonts?: SatoriOptions['fonts'];
  debug?: boolean;
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  tailwindConfig?: SatoriOptions['tailwindConfig'];
}

export const generateImage = async (
  element: string,
  options: ImageResponseOptions,
): Promise<Buffer> => {
  const elementHtml = toReactElement(element);

  const svg = await satori(elementHtml as any, {
    width: options.width ?? 1200,
    height: options.height ?? 630,
    fonts: options.fonts ?? [],
    tailwindConfig: options.tailwindConfig,
  });

  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: options.width ?? 1200,
    },
  });

  const pngData = resvg.render();
  return Buffer.from(pngData.asPng());
};

export class ImageResponse extends Response {
  constructor(element: string, options: ImageResponseOptions = {}) {
    const body = new ReadableStream({
      async start(controller) {
        const buffer = await generateImage(element, options);
        controller.enqueue(buffer);
        controller.close();
      },
    });

    super(body, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': options.debug
          ? 'no-cache, no-store'
          : 'public, immutable, no-transform, max-age=31536000',
        ...options.headers,
      },
      status: options.status ?? 200,
      statusText: options.statusText,
    });
  }

  async writeTo(res: ExpressResponse): Promise<void> {
    res.status(this.status);

    this.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const buffer = Buffer.from(await this.arrayBuffer());
    res.send(buffer);
  }
}
