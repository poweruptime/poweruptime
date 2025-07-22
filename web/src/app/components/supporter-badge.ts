import {ChangeDetectionStrategy, Component, booleanAttribute, computed, input} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {MatTooltip} from '@angular/material/tooltip';

import {Subject, throttleTime} from 'rxjs';

import {format} from '@std/fmt/duration';
import confetti from 'canvas-confetti';
import {n_generate_float, n_generate_int} from 'dfts-helper';

@Component({
  template: `
    @if (supportDuration(); as supportDuration) {
      @if (!hide()) {
        <button
          class="rainbow-border glow inline-block rounded-lg p-1 hover:cursor-pointer"
          [matTooltip]="'Supports poweruptime for atleast ' + supportDuration"
          (click)="confetti.next(true)"
          type="button">
          <div
            class="flex items-center gap-2 rounded bg-gray-900 px-2 py-1.5 font-semibold text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24">
              <!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE -->
              <path
                fill="currentColor"
                d="m9.675 13.7l.875-2.85L8.25 9h2.85l.9-2.8l.9 2.8h2.85l-2.325 1.85l.875 2.85l-2.3-1.775zM6 23v-7.725q-.95-1.05-1.475-2.4T4 10q0-3.35 2.325-5.675T12 2t5.675 2.325T20 10q0 1.525-.525 2.875T18 15.275V23l-6-2zm6-7q2.5 0 4.25-1.75T18 10t-1.75-4.25T12 4T7.75 5.75T6 10t1.75 4.25T12 16" />
            </svg>
            <span class="hidden sm:inline">Supporter</span>
          </div>
        </button>
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
  imports: [MatTooltip],
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
