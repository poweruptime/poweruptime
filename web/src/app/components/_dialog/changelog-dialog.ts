import {ChangeDetectionStrategy, Component} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';
import {BrnDialogClose, injectBrnDialogContext} from '@spartan-ng/brain/dialog';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmDialogFooter} from '@spartan-ng/helm/dialog';

@Component({
  template: `
    <div class="flex-1 overflow-y-auto">
      <div class="prose dark:prose-invert" [innerHTML]="changelog"></div>
    </div>
    <hlm-dialog-footer class="gap-3 border-t pt-4 sm:space-x-0">
      <button type="button" hlmBtn variant="outline" brnDialogClose>
        {{ 'general.close' | transloco }}
      </button>
    </hlm-dialog-footer>
  `,
  host: {
    class:
      'top-1/2 left-1/2 flex max-h-[calc(100vh-2rem)] w-full max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-lg p-0 sm:max-h-[min(640px,80vh)] sm:max-w-xl',
  },
  selector: 'pu-changelog-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe, BrnDialogClose, HlmDialogFooter, HlmButtonImports],
})
export class ChangelogDialog {
  private readonly data = injectBrnDialogContext<{changelog: string}>();

  protected readonly changelog = this.data.changelog;
}
