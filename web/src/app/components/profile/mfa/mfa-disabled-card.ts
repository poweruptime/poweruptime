import {ChangeDetectionStrategy, Component, output} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmCardImports} from '@spartan-ng/helm/card';
import {HlmIconImports} from '@spartan-ng/helm/icon';

@Component({
  template: `
    <section hlmCard>
      <div hlmCardHeader>
        <h3 hlmCardTitle>{{ 'mfa.disabled.title' | transloco }}</h3>
        <span hlmCardDescription>{{ 'mfa.disabled.description' | transloco }}</span>
      </div>
      <div hlmCardContent>
        <div class="bg-muted/50 border-border flex items-start gap-3 rounded-lg border p-4">
          <div
            class="bg-muted mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
            <ng-icon hlm size="sm" name="bootstrapInfoCircle" />
          </div>
          <div class="flex-1">
            <p class="text-foreground mb-1 text-sm font-medium">
              {{ 'mfa.disabled.title' | transloco }}
            </p>
            <p class="text-muted-foreground text-xs leading-relaxed">
              {{ 'mfa.disabled.description' | transloco }}
            </p>
          </div>
        </div>
      </div>
      <div hlmCardFooter>
        <button class="w-full" (click)="enableMFA.emit()" hlmBtn type="button">
          {{ 'mfa.disabled.setup' | transloco }}
        </button>
      </div>
    </section>
  `,
  selector: 'pu-mfa-disabled-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe, HlmButtonImports, HlmCardImports, HlmIconImports],
})
export class MFADisabledCard {
  enableMFA = output();
}
