import {Pipe, PipeTransform} from '@angular/core';

const colors = [
  '#7f1d1d',
  '#991b1b',
  '#b91c1c',
  '#dc2626',
  '#ef4444',
  '#22c55e',
  '#16a34a',
  '#15803d',
  '#166534',
  '#14532d',
  '#052e16',
];

@Pipe({
  name: 'heatmapDotBackground',
  standalone: true,
  pure: true,
})
export class HeatmapDotBackgroundPipe implements PipeTransform {
  transform(value: string | number) {
    if (typeof value === 'string') {
      value = Number(value.replace(',', '.').replace('%', ''));
    }
    if (value === 100) {
      return colors.at(-1);
    }
    if (value < 10) {
      return colors[0];
    }
    return colors[Number(value.toString()[0])];
  }
}
