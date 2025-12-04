import {httpResource} from '@angular/common/http';
import {Component, computed, input} from '@angular/core';
import {RouterLink} from '@angular/router';

import {MatIconAnchor, MatIconButton} from '@angular/material/button';
import {MatChip, MatChipSet} from '@angular/material/chips';
import {MatTooltip} from '@angular/material/tooltip';

import {TranslocoPipe} from '@jsverse/transloco';
import {NgIcon} from '@ng-icons/core';
import {a_hashFrom} from 'dfts-helper';
import {StopPropagationDirective} from 'dfx-helper';

import {BackendType} from '@app/api';

import {TeamCardMonitorCount} from './team-card-monitor-count';

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

@Component({
  template: `
    @let _team = team();
    <a [routerLink]="_team.id">
      <div class="group flex h-[230px] flex-col rounded-xl">
        <div
          class="relative h-40 w-full overflow-hidden rounded-t-xl"
          [style.background-color]="'#dfdbe5'">
          <div
            class="absolute inset-0 transition-transform duration-200 group-hover:scale-110"
            [style.background-image]="backgroundPattern()"
            [style.background-position]="'center'"></div>
        </div>
        <div class="rounded-b-xl border-r border-b border-l px-4 pb-4">
          <div class="mt-3 flex items-center justify-between">
            <div class="inline-flex items-center gap-2">
              <span class="text-2xl">{{ _team.name }}</span>
              @if (_team.personal) {
                <mat-chip-set>
                  <mat-chip>{{ 'general.personal' | transloco }}</mat-chip>
                </mat-chip-set>
              }
            </div>

            <a
              [routerLink]="_team.id + '/edit'"
              [attr.aria-label]="'team.settings.settings' | transloco"
              [matTooltip]="'team.settings.settings' | transloco"
              stopPropagation
              mat-icon-button>
              <ng-icon name="bootstrapGear" size="24" aria-hidden="true" />
            </a>
          </div>

          <pu-team-card-monitor-count [team]="_team" />
        </div>
      </div>
    </a>
  `,
  selector: 'pu-team-card',
  imports: [
    MatChipSet,
    MatChip,
    RouterLink,
    NgIcon,
    MatIconAnchor,
    StopPropagationDirective,
    MatTooltip,
    TeamCardMonitorCount,
    TranslocoPipe,
    MatIconButton,
  ],
})
export class TeamCard {
  readonly team = input.required<BackendType['TeamResponse']>();

  readonly patternIndexArray = Array.from({length: 61}, (_, it) => it.toString());

  readonly rawPattern = httpResource.text(
    () => `/assets/patterns/${a_hashFrom(this.patternIndexArray, this.team().id)}.svg`,
  );

  readonly backgroundPattern = computed(() => {
    const rawPattern = this.rawPattern.value();
    if (!rawPattern) {
      return undefined;
    }

    const svg = rawPattern
      .replace(/[\r\n]+/g, ' ')
      .replace(/"/g, "'")
      .trim();

    const encoded = encodeURIComponent(svg).replace(/'/g, '%27').replace(/"/g, '%22');

    return getBgImage(`url("data:image/svg+xml,${encoded}")`, this.fillColor(), '0.42');
  });

  private readonly fillColor = computed(() => a_hashFrom(this.foregroundColors, this.team().id));

  private readonly foregroundColors = [
    '#3f6212',
    '#1f2937',
    '#dc2626',
    '#0f172a',
    '#b45309',
    '#047857',
    '#be123c',
  ];
}
