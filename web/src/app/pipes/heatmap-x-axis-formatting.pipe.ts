import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'heatmapXAxisFormatting',
  standalone: true,
  pure: true,
})
export class HeatmapXAxisFormattingPipe implements PipeTransform {
  transform(value: string) {
    const monday = new Date(`${value}T00:00:00Z`);
    const lastSunday = new Date(monday);
    lastSunday.setUTCDate(monday.getUTCDate() - 1);
    const nextSunday = new Date(monday);
    nextSunday.setUTCDate(monday.getUTCDate() + 6);
    return lastSunday.getUTCMonth() !== nextSunday.getUTCMonth() ? nextSunday : '';
  }
}
