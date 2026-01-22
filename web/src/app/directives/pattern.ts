import {httpResource} from '@angular/common/http';
import {Directive, computed, input} from '@angular/core';

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

@Directive({
  selector: '[pu-pattern]',
  host: {
    '[style.background-image]': 'bgImage()',
    '[style.background-color]': '"#dfdbe5"',
  },
})
export class Pattern {
  readonly hash = input.required<string>({
    alias: 'pu-pattern',
  });

  protected readonly bgImage = computed(() => {
    const rawPattern = this.rawPattern$.value();

    if (!rawPattern) {
      return undefined;
    }

    const svg = rawPattern
      .replace(/[\r\n]+/g, ' ')
      .replace(/"/g, "'")
      .trim();

    const encoded = encodeURIComponent(svg).replace(/'/g, '%27').replace(/"/g, '%22');

    const backgroundUrl = `url("data:image/svg+xml,${encoded}")`;

    return getBgImage(backgroundUrl, a_hashFrom(foregroundColors, this.hash()), '0.42');
  });

  private readonly rawPattern$ = httpResource
    .text(() => `/assets/patterns/${a_hashFrom(patternIndexArray, this.hash())}.svg`)
    .asReadonly();
}
