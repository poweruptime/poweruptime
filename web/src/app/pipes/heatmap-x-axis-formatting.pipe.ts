import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'heatmapXAxisFormatting',
  standalone: true,
  pure: true,
})
export class HeatmapXAxisFormattingPipe implements PipeTransform {
  transform(value: string) {
    const monday = new Date(value);
    const month = monday.getMonth();
    const day = monday.getDate();
    const year = monday.getFullYear();
    const lastSunday = new Date(year, month, day - 1);
    const nextSunday = new Date(year, month, day + 6);
    return lastSunday.getMonth() !== nextSunday.getMonth() ? nextSunday : '';
  }
}
