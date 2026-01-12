import {Component, input} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';
import {BrnDialogClose, BrnDialogContent} from '@spartan-ng/brain/dialog';
import {BrnTooltipContentTemplate} from '@spartan-ng/brain/tooltip';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmDialogImports} from '@spartan-ng/helm/dialog';
import {HlmItemImports} from '@spartan-ng/helm/item';
import {HlmTooltipImports} from '@spartan-ng/helm/tooltip';

export interface Dependency {
  moduleName: string;
  moduleUrl: string;
  moduleVersion: string;
  moduleLicense: string;
  moduleLicenseUrl?: string;
}

@Component({
  template: `
    <hlm-dialog autoFocus="dialog">
      <button
        class="hover:bg-accent h-11 w-full justify-start gap-3 text-base"
        hlmDialogTrigger
        type="button"
        hlmBtn
        variant="ghost">
        {{ btnText() }}
      </button>
      <hlm-dialog-content
        class="top-1/2 left-1/2 flex max-h-[calc(100vh-2rem)] w-full max-w-[calc(100%-2rem)] -translate-x-1/2 flex-col gap-0 overflow-hidden rounded-lg p-0 sm:max-h-[min(640px,80vh)] sm:max-w-xl"
        *brnDialogContent="let ctx">
        <div class="flex-1 overflow-y-auto">
          <hlm-dialog-header>
            <h2 class="mb-0 px-6 pt-6 text-lg font-semibold">{{ btnText() }} Licenses</h2>
          </hlm-dialog-header>

          <div class="grid gap-2 p-6">
            @for (license of licenses(); track $index) {
              <a
                [href]="license.moduleUrl"
                hlmItem
                variant="outline"
                rel="noreferrer"
                target="_blank">
                <div hlmItemContent>
                  <div class="text-start" hlmItemTitle>{{ license.moduleName }}</div>
                  <p class="text-start" hlmItemDescription>{{ license.moduleVersion }}</p>
                </div>
                <div hlmItemActions>
                  @if (license.moduleLicenseUrl; as url) {
                    <hlm-tooltip>
                      <a
                        [href]="url"
                        target="_blank"
                        rel="noreferrer"
                        hlmBtn
                        hlmTooltipTrigger
                        variant="outline"
                        size="sm">
                        <span class="max-w-36 truncate">
                          {{ license.moduleLicense }}
                        </span>
                      </a>
                      <span *brnTooltipContent>{{ license.moduleLicense }}</span>
                    </hlm-tooltip>
                  } @else {
                    <hlm-tooltip>
                      <button type="button" hlmTooltipTrigger hlmBtn variant="outline" size="sm">
                        <span class="max-w-36 truncate">{{ license.moduleLicense }}</span>
                      </button>
                      <span *brnTooltipContent>{{ license.moduleLicense }}</span>
                    </hlm-tooltip>
                  }
                </div>
              </a>
            }
          </div>
        </div>
        <hlm-dialog-footer class="gap-3 border-t px-6 py-4 sm:space-x-0">
          <button type="button" hlmBtn variant="outline" brnDialogClose>
            {{ 'general.close' | transloco }}
          </button>
        </hlm-dialog-footer>
      </hlm-dialog-content>
    </hlm-dialog>
  `,
  selector: 'pu-license-dialog',
  imports: [
    HlmDialogImports,
    HlmButtonImports,
    TranslocoPipe,
    BrnDialogContent,
    BrnDialogClose,
    HlmItemImports,
    HlmTooltipImports,
    BrnTooltipContentTemplate,
  ],
})
export class LicenseDialog {
  btnText = input.required<string>();

  licenses = input.required<Dependency[]>();
}
