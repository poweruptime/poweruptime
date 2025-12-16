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

import {MatButton} from '@angular/material/button';
import {
  MatCard,
  MatCardContent,
  MatCardHeader,
  MatCardSubtitle,
  MatCardTitle,
} from '@angular/material/card';

import {NgIcon} from '@ng-icons/core';

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
    @if (infoStore.environment(); as environmentInfo) {
      <div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <!-- System Information -->
        <mat-card>
          <mat-card-header>
            <mat-card-title>
              <div class="mb-2 flex items-center gap-2">
                <ng-icon size="20" name="bootstrapDisplay" />
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  System Information
                </h3>
              </div>
            </mat-card-title>
            <mat-card-subtitle>
              <p class="text-sm">Runtime and operating system details</p>
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="space-y-1 pt-4">
              <div class="flex items-center justify-between py-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Java Runtime
                </span>
                <span class="font-mono text-sm text-gray-900 dark:text-gray-100">
                  {{ environmentInfo.javaRuntimeVersion }}
                </span>
              </div>
              <div class="flex items-center justify-between py-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Operating System
                </span>
                <span class="font-mono text-sm text-gray-900 dark:text-gray-100">
                  {{ environmentInfo.osName }}
                </span>
              </div>
              <div class="flex items-center justify-between py-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Architecture
                </span>
                <span class="font-mono text-sm text-gray-900 dark:text-gray-100">
                  {{ environmentInfo.osArch }}
                </span>
              </div>
              <div class="flex items-center justify-between py-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">OS Version</span>
                <span class="font-mono text-sm text-gray-900 dark:text-gray-100">
                  {{ environmentInfo.osVersion }}
                </span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Server Configuration -->
        <mat-card>
          <mat-card-header>
            <mat-card-title>
              <div class="mb-2 flex items-center gap-2">
                <ng-icon size="20" name="bootstrapServer" />
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  Network and service
                </h3>
              </div>
            </mat-card-title>
            <mat-card-subtitle>
              <p class="text-sm">Network and service settings</p>
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="space-y-1 pt-4">
              <div class="flex items-center justify-between py-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Host</span>
                <span class="font-mono text-sm text-gray-900 dark:text-gray-100">
                  {{ infoStore.host() }}
                </span>
              </div>
              @if (environment.isBetaOrDevChannel) {
                <div class="flex items-center justify-between py-2">
                  <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Port</span>
                  <span class="font-mono text-sm text-gray-900 dark:text-gray-100">
                    {{ environmentInfo.port }}
                  </span>
                </div>
              }
              <div class="flex items-center justify-between py-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Log Level</span>
                <span
                  class="rounded-md border border-gray-300 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  {{ environmentInfo.logLevel }}
                </span>
              </div>
              <div class="flex items-center justify-between py-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Service started
                </span>
                <span class="font-mono text-sm text-gray-900 dark:text-gray-100">
                  {{ infoStore.time()?.serverStartTime | date: 'yyyy.MM.dd HH:mm:ss ZZ' }}
                </span>
              </div>
              <div class="flex items-center justify-between py-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Server time
                </span>
                <span class="font-mono text-sm text-gray-900 dark:text-gray-100">
                  {{ infoStore.time()?.serverTime | date: 'yyyy.MM.dd HH:mm:ss ZZ' }}
                </span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Mail Configuration -->
        <mat-card>
          <mat-card-header>
            <mat-card-title>
              <div class="mb-2 flex items-center gap-2">
                <ng-icon size="20" name="bootstrapEnvelope" />
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  Mail Configuration
                </h3>
              </div>
            </mat-card-title>
            <mat-card-subtitle>
              <p class="text-sm">Email service settings</p>
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="space-y-1 pt-4">
              <div class="flex items-center justify-between py-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Mail Service
                </span>
                <span [puStatusBadge]="environmentInfo.mailEnabled">
                  {{ environmentInfo.mailEnabled | statusText }}
                </span>
              </div>
              <div class="flex items-center justify-between py-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Mail Host</span>
                <span class="font-mono text-sm text-gray-900 dark:text-gray-100">
                  {{ environmentInfo.mailHost }}
                </span>
              </div>
              <div class="flex items-center justify-between py-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Mail Port</span>
                <span class="font-mono text-sm text-gray-900 dark:text-gray-100">
                  {{ environmentInfo.mailPort }}
                </span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Features & Notifications -->
        <mat-card>
          <mat-card-header>
            <mat-card-title>
              <div class="mb-2 flex items-center gap-2">
                <ng-icon size="20" name="bootstrapStars" />
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Features</h3>
              </div>
            </mat-card-title>
            <mat-card-subtitle>
              <p class="text-sm">Service feature toggles</p>
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="space-y-1 pt-4">
              <div class="flex items-center justify-between py-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Push Notifications
                </span>
                <span [puStatusBadge]="environmentInfo.pushEnabled">
                  {{ environmentInfo.pushEnabled | statusText }}
                </span>
              </div>
              <div class="flex items-center justify-between py-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Swagger API Docs
                </span>
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
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Temporary Notifications
                </span>

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
          </mat-card-content>
        </mat-card>

        <!-- Rate Limiting -->
        <mat-card>
          <mat-card-header>
            <mat-card-title>
              <div class="mb-2 flex items-center gap-2">
                <ng-icon size="20" name="bootstrapShieldShaded" />
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Rate Limiting</h3>
              </div>
            </mat-card-title>
            <mat-card-subtitle>
              <p class="text-sm">Auth API rate limiting configuration</p>
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="space-y-1 pt-4">
              <div class="flex items-center justify-between py-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Rate Limiting
                </span>
                <span [puStatusBadge]="environmentInfo.rateLimitEnabled">
                  {{ environmentInfo.rateLimitEnabled | statusText }}
                </span>
              </div>
              <div class="flex items-center justify-between py-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Duration</span>
                <span class="font-mono text-sm text-gray-900 dark:text-gray-100">
                  {{ environmentInfo.rateLimitDurationInSeconds }}s
                </span>
              </div>
              <div class="flex items-center justify-between py-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Max Tries</span>
                <span class="font-mono text-sm text-gray-900 dark:text-gray-100">
                  {{ environmentInfo.rateLimitTries }}
                </span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- OAuth2 Providers -->
        <mat-card>
          <mat-card-header>
            <mat-card-title>
              <div class="mb-2 flex items-center gap-2">
                <ng-icon size="20" name="bootstrapPersonCircle" />
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  OAuth2 Providers
                </h3>
              </div>
            </mat-card-title>
            <mat-card-subtitle>
              <p class="text-sm">Authentication provider configuration</p>
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="space-y-4 pt-4">
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

                  <div class="font-mono text-xs break-all text-gray-600 dark:text-gray-400">
                    {{ provider.clientId }}
                  </div>
                  @if (!$last) {
                    <hr class="border-gray-200 dark:border-gray-700" />
                  }
                </div>
              } @empty {
                <div class="flex flex-wrap items-center gap-2">
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    No OAuth2 providers configured.
                  </p>

                  <a
                    mat-button
                    target="_blank"
                    rel="noopener"
                    href="https://github.com/poweruptime/poweruptime/blob/main/infrastructure/README.md#oauth2-guide">
                    <ng-icon name="bootstrapBoxArrowUpRight" />
                    Learn more
                  </a>
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    }
  `,
  selector: 'pu-instance-settings-info-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgIcon,
    MatButton,
    StatusBadge,
    StatusText,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardSubtitle,
    MatCardContent,
    DatePipe,
  ],
})
export class InstanceSettingsInfoPage {
  protected readonly environment = environment;

  readonly infoStore = inject(InfoStore);

  constructor() {
    this.infoStore.loadEnvironment();
    this.infoStore.loadSupport();
    this.infoStore.loadOAuth2Providers();
  }
}
