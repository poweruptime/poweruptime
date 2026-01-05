import {ChangeDetectionStrategy, Component, computed} from '@angular/core';

import {HlmSkeletonImports} from '@spartan-ng/helm/skeleton';

@Component({
  selector: 'pu-chart-placeholder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmSkeletonImports],
  host: {
    class: 'bg-muted flex flex-col justify-end gap-2 rounded p-4;',
    role: 'presentation',
  },
  template: `
    <div class="flex h-full items-end justify-between gap-2">
      @for (bar of bars(); track $index) {
        <hlm-skeleton
          class="flex-1 rounded-t"
          [style.height]="bar.height"
          [style.animation-delay]="bar.delay" />
      }
    </div>
  `,
})
export class ChartPlaceholder {
  // Simulate the bar data (8 bars, each with randomized height and animation delay)
  private readonly baseBars = Array.from({length: 50});

  readonly bars = computed(() =>
    this.baseBars.map((_, i) => ({
      height: `${Math.random() * 60 + 20}%`,
      delay: `${i * 50}ms`,
    })),
  );
}
