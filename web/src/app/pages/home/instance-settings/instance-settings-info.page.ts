import {DatePipe} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  Pipe,
  PipeTransform,
  inject,
  input,
} from '@angular/core';

import {HlmBadgeImports} from '@spartan-ng/helm/badge';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmCardImports} from '@spartan-ng/helm/card';
import {HlmEmptyImports} from '@spartan-ng/helm/empty';
import {HlmIconImports} from '@spartan-ng/helm/icon';

import {InfoStore} from '@app/services';
import {environment} from '@app/util';

@Directive({
  selector: '[puStatusBadge]',
  host: {
    class: 'rounded-md px-2 py-1 text-xs font-medium inline-flex items-center gap-1',
    '[class.bg-black]': 'isEnabled()',
    '[class.dark:bg-white]': 'isEnabled()',
    '[class.text-white]': 'isEnabled()',
    '[class.dark:text-black]': 'isEnabled()',
    '[class.dark:bg-black]': '!isEnabled()',
    '[class.bg-white]': '!isEnabled()',
    '[class.dark:text-white]': '!isEnabled()',
    '[class.text-black]': '!isEnabled()',
  },
})
class StatusBadge {
  isEnabled = input.required({
    transform: (it: string) => it.toLowerCase() === 'true',
    alias: 'puStatusBadge',
  });
}

@Pipe({
  name: 'statusText',
  pure: true,
})
class StatusText implements PipeTransform {
  transform(enabled: string) {
    return enabled.toLowerCase() === 'true' ? 'Enabled' : 'Disabled';
  }
}

@Component({
  template: `
    <div class="p-0 md:p-0" hlmEmpty>
      <div hlmEmptyHeader>
        <div hlmEmptyMedia variant="icon">
          <ng-icon hlm name="bootstrapPersonCircle" />
        </div>
        <div hlmEmptyTitle>No OAuth2 Providers configured</div>
        <div hlmEmptyDescription>You haven&apos;t configured any OAuth2 Providers yet.</div>
      </div>
      <a
        target="_blank"
        rel="noopener"
        href="https://github.com/poweruptime/poweruptime/blob/main/infrastructure/README.md#oauth2-guide">
        <button class="text-muted-foreground" type="button" hlmBtn variant="link" size="sm">
          Learn More
          <ng-icon hlm name="lucideArrowUpRight" size="sm" />
        </button>
      </a>
    </div>
  `,
  selector: 'pu-empty-oauth2-providers',
  imports: [HlmEmptyImports, HlmIconImports, HlmButtonImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class EmptyOAuth2Providers {}

@Component({
  template: `
    @if (infoStore.environment(); as environmentInfo) {
      <div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <!-- System Information -->
        <section class="h-full w-full" hlmCard>
          <div hlmCardHeader>
            <div class="flex items-center gap-2">
              <ng-icon hlm name="bootstrapDisplay" />
              <h3 hlmCardTitle>System Information</h3>
            </div>
            <p hlmCardDescription>Runtime and operating system details</p>
          </div>

          <div hlmCardContent>
            <div class="flex items-center justify-between py-2">
              <span class="text-foreground text-sm font-bold">Java Runtime</span>
              <span class="text-secondary-foreground font-mono text-sm">
                {{ environmentInfo.javaRuntimeVersion }}
              </span>
            </div>
            <div class="flex items-center justify-between py-2">
              <span class="text-foreground text-sm font-bold">Operating System</span>
              <span class="text-secondary-foreground font-mono text-sm">
                {{ environmentInfo.osName }}
              </span>
            </div>
            <div class="flex items-center justify-between py-2">
              <span class="text-foreground text-sm font-bold">Architecture</span>
              <span class="text-secondary-foreground font-mono text-sm">
                {{ environmentInfo.osArch }}
              </span>
            </div>
            <div class="flex items-center justify-between py-2">
              <span class="text-foreground text-sm font-bold">OS Version</span>
              <span class="text-secondary-foreground font-mono text-sm">
                {{ environmentInfo.osVersion }}
              </span>
            </div>
          </div>
        </section>

        <!-- Server Configuration -->
        <section class="h-full w-full" hlmCard>
          <div hlmCardHeader>
            <div class="flex items-center gap-2">
              <ng-icon hlm name="bootstrapServer" />
              <h3 hlmCardTitle>Network and service</h3>
            </div>
          </div>

          <div hlmCardContent>
            <div class="flex items-center justify-between py-2">
              <span class="text-foreground text-sm font-bold">Host</span>
              <span class="text-secondary-foreground font-mono text-sm">
                {{ infoStore.host() }}
              </span>
            </div>
            @if (environment.isBetaOrDevChannel) {
              <div class="flex items-center justify-between py-2">
                <span class="text-foreground text-sm font-bold">Port</span>
                <span class="text-secondary-foreground font-mono text-sm">
                  {{ environmentInfo.port }}
                </span>
              </div>
            }
            <div class="flex items-center justify-between py-2">
              <span class="text-foreground text-sm font-bold">Log Level</span>
              <span hlmBadge variant="secondary">{{ environmentInfo.logLevel }}</span>
            </div>
            <div class="flex items-center justify-between py-2">
              <span class="text-foreground text-sm font-bold">Service started</span>
              <span class="text-secondary-foreground font-mono text-sm">
                {{ infoStore.time()?.serverStartTime | date: 'yyyy.MM.dd HH:mm:ss ZZ' }}
              </span>
            </div>
            <div class="flex items-center justify-between py-2">
              <span class="text-foreground text-sm font-bold">Server time</span>
              <span class="text-secondary-foreground font-mono text-sm">
                {{ infoStore.time()?.serverTime | date: 'yyyy.MM.dd HH:mm:ss ZZ' }}
              </span>
            </div>
          </div>
        </section>

        <!-- Mail Configuration -->
        <section class="h-full w-full" hlmCard>
          <div hlmCardHeader>
            <div class="flex items-center gap-2">
              <ng-icon hlm name="bootstrapEnvelope" />
              <h3 hlmCardTitle>Mail Configuration</h3>
            </div>
            <p hlmCardDescription>Email service settings</p>
          </div>

          <div hlmCardContent>
            <div class="flex items-center justify-between py-2">
              <span class="text-foreground text-sm font-bold">Mail Service</span>
              <span [puStatusBadge]="environmentInfo.mailEnabled">
                {{ environmentInfo.mailEnabled | statusText }}
              </span>
            </div>
            <div class="flex items-center justify-between py-2">
              <span class="text-foreground text-sm font-bold">Mail Host</span>
              <span class="text-secondary-foreground font-mono text-sm">
                {{ environmentInfo.mailHost }}
              </span>
            </div>
            <div class="flex items-center justify-between py-2">
              <span class="text-foreground text-sm font-bold">Mail Port</span>
              <span class="text-secondary-foreground font-mono text-sm">
                {{ environmentInfo.mailPort }}
              </span>
            </div>
          </div>
        </section>

        <!-- Features & Notifications -->
        <section class="h-full w-full" hlmCard>
          <div hlmCardHeader>
            <div class="flex items-center gap-2">
              <ng-icon hlm name="bootstrapStars" />
              <h3 hlmCardTitle>Features</h3>
            </div>
            <p hlmCardDescription>Service feature toggles</p>
          </div>

          <div hlmCardContent>
            <div class="flex items-center justify-between py-2">
              <span class="text-foreground text-sm font-bold">Push Notifications</span>
              <span [puStatusBadge]="environmentInfo.pushEnabled">
                {{ environmentInfo.pushEnabled | statusText }}
              </span>
            </div>
            <div class="flex items-center justify-between py-2">
              <span class="text-foreground text-sm font-bold">Swagger API Docs</span>
              @if (environmentInfo.swaggerEnabled === 'true') {
                <a
                  [puStatusBadge]="environmentInfo.swaggerEnabled"
                  href="/api/swagger/docs"
                  target="_blank">
                  {{ environmentInfo.swaggerEnabled | statusText }}
                  <ng-icon size="12" name="bootstrapBoxArrowUpRight" />
                </a>
              } @else {
                <span [puStatusBadge]="environmentInfo.swaggerEnabled">
                  {{ environmentInfo.swaggerEnabled | statusText }}
                </span>
              }
            </div>
            <div class="flex items-center justify-between py-2">
              <span class="text-foreground text-sm font-bold">Temporary Notifications</span>

              @if (environmentInfo.tempNotificationsEnabled === 'true') {
                <a
                  [puStatusBadge]="environmentInfo.tempNotificationsEnabled"
                  href="/api/v1/public/temp-notification"
                  target="_blank">
                  {{ environmentInfo.tempNotificationsEnabled | statusText }}
                  <ng-icon size="12" name="bootstrapBoxArrowUpRight" />
                </a>
              } @else {
                <span [puStatusBadge]="environmentInfo.tempNotificationsEnabled">
                  {{ environmentInfo.tempNotificationsEnabled | statusText }}
                </span>
              }
            </div>
          </div>
        </section>

        <!-- Rate Limiting -->
        <section class="h-full w-full" hlmCard>
          <div hlmCardHeader>
            <div class="flex items-center gap-2">
              <ng-icon hlm name="bootstrapShieldShaded" />
              <h3 hlmCardTitle>Rate Limiting</h3>
            </div>
          </div>

          <div hlmCardContent>
            <div class="flex items-center justify-between py-2">
              <span class="text-foreground text-sm font-bold">Rate Limiting</span>
              <span [puStatusBadge]="environmentInfo.rateLimitEnabled">
                {{ environmentInfo.rateLimitEnabled | statusText }}
              </span>
            </div>
            <div class="flex items-center justify-between py-2">
              <span class="text-foreground text-sm font-bold">Duration</span>
              <span class="text-secondary-foreground font-mono text-sm">
                {{ environmentInfo.rateLimitDurationInSeconds }}s
              </span>
            </div>
            <div class="flex items-center justify-between py-2">
              <span class="text-foreground text-sm font-bold">Max Tries</span>
              <span class="text-secondary-foreground font-mono text-sm">
                {{ environmentInfo.rateLimitTries }}
              </span>
            </div>
          </div>
        </section>

        <!-- OAuth2 Providers -->
        <section class="h-full w-full" hlmCard>
          @if (infoStore.oauth2Providers().length > 0) {
            <div hlmCardHeader>
              <div class="flex items-center gap-2">
                <ng-icon hlm name="bootstrapPersonCircle" />
                <h3 hlmCardTitle>OAuth2 Providers</h3>
              </div>
            </div>

            <div hlmCardContent>
              @for (provider of infoStore.oauth2Providers(); track provider.registrationId) {
                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <div class="inline-flex items-center gap-2">
                      <span
                        class="rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white dark:bg-gray-100 dark:text-gray-900">
                        {{ provider.clientName }}
                      </span>
                      <span class="text-sm text-gray-600 dark:text-gray-400">
                        ({{ provider.registrationId }})
                      </span>
                    </div>

                    <a
                      class="inline-flex items-center gap-2 hover:cursor-pointer"
                      [href]="
                        provider.registrationId === 'keycloak'
                          ? 'https://www.keycloak.org/docs/latest/server_admin/index.html'
                          : 'https://developers.google.com/identity/protocols/oauth2'
                      "
                      target="_blank"
                      rel="noopener">
                      <ng-icon name="bootstrapBoxArrowUpRight" />
                      Docs
                    </a>
                  </div>

                  <div class="font-mono text-xs break-all">
                    {{ provider.clientId }}
                  </div>
                  @if (!$last) {
                    <hr class="border-gray-200 dark:border-gray-700" />
                  }
                </div>
              }
            </div>
          } @else {
            <pu-empty-oauth2-providers />
          }
        </section>
      </div>
    }
  `,
  selector: 'pu-instance-settings-info-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    StatusBadge,
    StatusText,
    DatePipe,
    HlmCardImports,
    HlmIconImports,
    EmptyOAuth2Providers,
    HlmBadgeImports,
  ],
})
export class InstanceSettingsInfoPage {
  protected readonly environment = environment;

  readonly infoStore = inject(InfoStore);

  constructor() {
    this.infoStore.loadHost();
    this.infoStore.loadEnvironment();
    this.infoStore.loadSupport();
    this.infoStore.loadOAuth2Providers();
    this.infoStore.loadTime();
  }
}
