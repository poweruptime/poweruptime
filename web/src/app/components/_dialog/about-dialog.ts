import {ChangeDetectionStrategy, Component, inject} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';
import {BrnDialogClose} from '@spartan-ng/brain/dialog';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmCardImports} from '@spartan-ng/helm/card';
import {HlmDialogImports} from '@spartan-ng/helm/dialog';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmItemImports} from '@spartan-ng/helm/item';

import {InfoStore} from '@app/services';

import {SupporterBadge} from '../supporter-badge';

@Component({
  template: `
    <div class="flex-1 overflow-y-auto">
      <hlm-dialog-header>
        <h3 hlmDialogTitle>{{ 'general.about' | transloco }} poweruptime</h3>
        <p hlmDialogDescription>Self-hosted uptime monitoring tool for teams and individuals</p>
      </hlm-dialog-header>
      <div class="space-y-6">
        @if (infoStore.support(); as support) {
          <div class="flex flex-col items-center md:flex-row" hlmItem variant="outline" size="sm">
            @if (support.supportsSince) {
              <div hlmItemContent>
                <div hlmItemTitle>This server supports the development of poweruptime.</div>
              </div>
              <div hlmItemActions>
                <pu-supporter-badge
                  [hide]="!support.showSupportBadge"
                  [supportsSince]="support.supportsSince" />
              </div>
            } @else {
              <div class="text-center md:text-start" hlmItemContent>
                <div hlmItemTitle>Please consider supporting the development of poweruptime.</div>
              </div>
              <div hlmItemActions>
                <a href="https://github.com/sponsors/Dafnik" target="_blank" rel="noopener">
                  <button hlmBtn type="button">
                    GitHub Sponsors
                    <ng-icon hlm name="bootstrapBoxArrowUpRight" size="sm" />
                  </button>
                </a>
              </div>
            }
          </div>
        }
        <div>
          <h3 class="mb-3 flex items-center gap-2 font-semibold">Features</h3>
          <ul class="space-y-2">
            @for (feature of features; track $index) {
              <li class="flex items-start gap-2 text-sm">
                <ng-icon name="lucideCircleCheck" hlm size="sm" />
                <span>{{ feature }}</span>
              </li>
            }
          </ul>
        </div>

        <section hlmCard>
          <div hlmCardHeader>
            <h3 class="font-semibold" hlmCardTitle>Learn More</h3>
            <p hlmCardDescription>
              Visit our GitHub repository for documentation, setup guides, and more information.
            </p>
          </div>
          <div hlmCardFooter>
            <a
              href="https://github.com/poweruptime/poweruptime"
              target="_blank"
              rel="noopener noreferrer">
              <button type="button" hlmBtn variant="outline">
                <ng-icon hlm size="sm" name="bootstrapGithub" />
                View on GitHub
              </button>
            </a>
          </div>
        </section>
      </div>
    </div>
    <hlm-dialog-footer class="pt-3">
      <button type="button" hlmBtn variant="outline" brnDialogClose>
        {{ 'general.close' | transloco }}
      </button>
    </hlm-dialog-footer>
  `,
  selector: 'pu-about-dialog',
  host: {
    class:
      'top-1/2 left-1/2 flex max-h-[calc(100vh-2rem)] w-full max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-lg p-0 sm:max-h-[min(640px,80vh)] sm:max-w-xl',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslocoPipe,
    HlmDialogImports,
    HlmButtonImports,
    BrnDialogClose,
    SupporterBadge,
    HlmIconImports,
    HlmItemImports,
    HlmCardImports,
  ],
})
export class AboutDialog {
  protected readonly infoStore = inject(InfoStore);

  protected readonly features = [
    'HTTP(s) / HTTP(s) Keyword Monitor',
    'Ping / DNS Record Monitor',
    'Push / SSL Certificates Monitor',
    'Multi-user / Team management',
    'Email, Discord, Slack & Apprise notifications',
    'Fast setup & SEO-friendly',
    '30-second monitoring intervals',
    'Multi-language support',
    'Multiple status pages with custom domains',
    'In-depth monitor analytics',
    '2FA & OAuth2 authentication',
  ];

  constructor() {
    this.infoStore.loadSupport();
  }
}
