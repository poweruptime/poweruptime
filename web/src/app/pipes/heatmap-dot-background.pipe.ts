import {Pipe, PipeTransform} from '@angular/core';

const colors = [
  'oklch(0.505 0.213 27.518)',
  'oklch(0.577 0.245 27.325)',
  'oklch(0.637 0.237 25.331)',
  'oklch(0.646 0.222 41.116)',
  'oklch(0.705 0.213 47.604)',
  'oklch(0.723 0.219 149.579)',
  'oklch(0.627 0.194 149.214)',
  'oklch(0.765 0.177 163.223)',
  'oklch(0.696 0.17 162.48)',
  'oklch(0.596 0.145 163.225)',
  'oklch(0.508 0.118 165.612)',
];

@Pipe({
  name: 'heatmapDotBackground',
  standalone: true,
  pure: true,
})
export class HeatmapDotBackgroundPipe implements PipeTransform {
  transform(value: number) {
    return colors[value];
  }
}

@Pipe({
  name: 'heatmapDotNumber',
  standalone: true,
  pure: true,
})
export class HeatmapDotNumberPipe implements PipeTransform {
  transform(value: string | number): number {
    if (typeof value === 'string') {
      value = Number(value.replace(',', '.').replace('%', ''));
    }
    if (value === 100) {
      return 10;
    }
    if (value < 10) {
      return 0;
    }
    return Number(value.toString()[0]);
  }
}
