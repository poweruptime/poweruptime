import {ChangeDetectionStrategy, Component, output} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmCardImports} from '@spartan-ng/helm/card';
import {HlmIconImports} from '@spartan-ng/helm/icon';

@Component({
  template: `
    <section hlmCard>
      <div hlmCardHeader>
        <h3 hlmCardTitle>{{ 'mfa.mfa' | transloco }}</h3>
        <span hlmCardDescription>{{ 'mfa.description' | transloco }}</span>
      </div>
      <div class="mb-6 space-y-3" hlmCardContent>
        <div class="bg-primary/5 border-primary/20 flex items-center gap-3 rounded-lg border p-4">
          <div class="bg-primary/10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
            <ng-icon name="lucideCheck" hlm />
          </div>
          <div class="flex-1">
            <p class="text-foreground text-sm font-medium">
              {{ 'mfa.enabled.info.1.title' | transloco }}
            </p>
            <p class="text-muted-foreground mt-0.5 text-xs">
              {{ 'mfa.enabled.info.1.description' | transloco }}
            </p>
          </div>
        </div>

        <div class="bg-muted/50 border-border flex items-center gap-3 rounded-lg border p-4">
          <div class="bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
            <ng-icon name="lucideLock" hlm />
          </div>
          <div class="flex-1">
            <p class="text-foreground text-sm font-medium">
              {{ 'mfa.enabled.info.2.title' | transloco }}
            </p>
            <p class="text-muted-foreground mt-0.5 text-xs">
              {{ 'mfa.enabled.info.2.description' | transloco }}
            </p>
          </div>
        </div>
      </div>
      <div hlmCardFooter>
        <button class="w-full" (click)="disableMFA.emit()" hlmBtn type="button">
          {{ 'mfa.enabled.disable' | transloco }}
        </button>
      </div>
    </section>
  `,
  selector: 'pu-mfa-enabled-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe, HlmButtonImports, HlmCardImports, HlmIconImports],
})
export class MFAEnabledCard {
  disableMFA = output();
}
