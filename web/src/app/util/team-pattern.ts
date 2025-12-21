import {HttpClient} from '@angular/common/http';
import {Signal, inject, signal} from '@angular/core';

import {filter, map, switchMap} from 'rxjs';

import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {a_hashFrom} from 'dfts-helper';

const foregroundColors = [
  '#3f6212',
  '#1f2937',
  '#dc2626',
  '#0f172a',
  '#b45309',
  '#047857',
  '#be123c',
];

const patternIndexArray = Array.from({length: 61}, (_, it) => it.toString());

function hexToRGB(hex: string): string {
  // Remove the '#' character if present
  hex = hex.replace(/^#/, '');

  // Check for valid hex color length
  if (hex.length !== 3 && hex.length !== 6) {
    throw new Error('Invalid hex color format');
  }

  // Expand shorthand form (e.g., '03F') to full form (e.g., '0033FF')
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('');
  }

  // Parse the r, g, b values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `${r},${g},${b}`;
}

function getBgImage(pattern: string, hex: string, alpha = '1') {
  return pattern.replace('FILLCOLOR', `rgb(${hexToRGB(hex)})`).replace('FILLOPACITY', alpha);
}

export function injectPattern(teamId: Signal<string>) {
  const httpClient = inject(HttpClient);

  const pattern = signal<string | undefined>(undefined);

  rxMethod<string>(
    switchMap((teamId) =>
      httpClient
        .get(`/assets/patterns/${a_hashFrom(patternIndexArray, teamId)}.svg`, {
          responseType: 'text',
        })
        .pipe(
          filter((it) => !!it),
          map((rawPattern) => {
            const svg = rawPattern
              .replace(/[\r\n]+/g, ' ')
              .replace(/"/g, "'")
              .trim();

            const encoded = encodeURIComponent(svg).replace(/'/g, '%27').replace(/"/g, '%22');

            pattern.set(
              getBgImage(
                `url("data:image/svg+xml,${encoded}")`,
                a_hashFrom(foregroundColors, teamId),
                '0.42',
              ),
            );
          }),
        ),
    ),
  )(teamId);

  return pattern.asReadonly();
}
