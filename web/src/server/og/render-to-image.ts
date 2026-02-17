import type {Response as ExpressResponse} from 'express';
import satori, {SatoriOptions} from 'satori';
import {html as toReactElement} from 'satori-html';
import sharp from 'sharp';

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
  const svg = await satori(toReactElement(element) as any, {
    width: options.width ?? 1200,
    height: options.height ?? 630,
    fonts: options.fonts ?? [],
    tailwindConfig: options.tailwindConfig,
  });
  return sharp(Buffer.from(svg)).png().toBuffer();
};

export const sendImageResponse = async (
  element: string,
  res: ExpressResponse,
  options: ImageResponseOptions = {},
): Promise<void> => {
  const buffer = await generateImage(element, options);

  res.status(options.status ?? 200);
  res.setHeader('Content-Type', 'image/png');
  res.setHeader(
    'Cache-Control',
    options.debug ? 'no-cache, no-store' : 'public, immutable, no-transform, max-age=31536000',
  );

  for (const [key, value] of Object.entries(options.headers ?? {})) {
    res.setHeader(key, value);
  }

  res.send(buffer);
};
