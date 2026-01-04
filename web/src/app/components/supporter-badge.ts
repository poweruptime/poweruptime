import {ChangeDetectionStrategy, Component, booleanAttribute, computed, input} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {Subject, throttleTime} from 'rxjs';

import {NgIcon} from '@ng-icons/core';
import {BrnTooltipContentTemplate} from '@spartan-ng/brain/tooltip';
import {HlmTooltipImports} from '@spartan-ng/helm/tooltip';
import {format} from '@std/fmt/duration';
import confetti from 'canvas-confetti';
import {n_generate_float, n_generate_int} from 'dfts-helper';

@Component({
  template: `
    @if (supportDuration(); as supportDuration) {
      @if (!hide()) {
        <hlm-tooltip>
          <button
            class="rainbow-border glow inline-block rounded-lg p-1 hover:cursor-pointer"
            (click)="confetti.next(true)"
            hlmTooltipTrigger
            type="button">
            <div
              class="flex items-center gap-2 rounded bg-gray-900 px-2 py-1.5 font-semibold text-white">
              <ng-icon name="lucideAward" size="26" />
              <span class="hidden sm:inline">Supporter</span>
            </div>
          </button>
          <span *brnTooltipContent>
            {{ 'Supports poweruptime for atleast ' + supportDuration }}
          </span>
        </hlm-tooltip>
      }
    }
  `,
  styles: `
    @keyframes rainbow {
      0% {
        background-position: 0 50%;
      }
      50% {
        background-position: 100% 50%;
      }
      100% {
        background-position: 0 50%;
      }
    }

    .rainbow-border {
      /* rainbow gradient */
      background: linear-gradient(
        270deg,
        #ef4444,
        /* red-500 */ #facc15,
        /* yellow-500 */ #a855f7 /* purple-500 */
      );
      /* enlarge so animation has room to move */
      background-size: 200% 200%;
      /* run the move-gradient animation */
      animation: rainbow 5s ease infinite;
    }

    .glow {
      /* subtle white-ish glow */
      box-shadow:
        0 0 8px rgba(255, 255, 255, 0.7),
        0 0 16px rgba(255, 255, 255, 0.5);
    }
  `,
  selector: 'pu-supporter-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon, HlmTooltipImports, BrnTooltipContentTemplate],
})
export class SupporterBadge {
  supportsSince = input<string | undefined>();
  hide = input(false, {transform: booleanAttribute});

  readonly supportDuration = computed(() => {
    const supportsSince = this.supportsSince();
    if (!supportsSince) {
      return undefined;
    }

    const duration = new Date().getTime() - new Date(supportsSince).getTime();
    return format(duration, {ignoreZero: true, style: 'full'}).split(',')[0];
  });

  readonly confetti = new Subject<boolean>();

  constructor() {
    this.confetti.pipe(takeUntilDestroyed(), throttleTime(1000)).subscribe(() => {
      void confetti({
        particleCount: n_generate_int(100, 200),
        spread: n_generate_int(160, 260),
        origin: {y: n_generate_float(0.25, 0.5, 2)},
      });
    });
  }
}
