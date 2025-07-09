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

import {BiComponent, provideBi, withSize} from 'dfx-bootstrap-icons';

import {InfoStore} from '@app/services';

@Directive({
  selector: '[puStatusBadge]',
  host: {
    class: 'rounded-md px-2 py-1 text-xs font-medium',
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
    @if (info(); as info) {
      <div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <!-- System Information -->
        <mat-card>
          <mat-card-header>
            <mat-card-title>
              <div class="mb-2 flex items-center gap-2">
                <bi name="display" />
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
                  {{ info.javaRuntimeVersion }}
                </span>
              </div>
              <div class="flex items-center justify-between py-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Operating System
                </span>
                <span class="font-mono text-sm text-gray-900 dark:text-gray-100">
                  {{ info.osName }}
                </span>
              </div>
              <div class="flex items-center justify-between py-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Architecture
                </span>
                <span class="font-mono text-sm text-gray-900 dark:text-gray-100">
                  {{ info.osArch }}
                </span>
              </div>
              <div class="flex items-center justify-between py-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">OS Version</span>
                <span class="font-mono text-sm text-gray-900 dark:text-gray-100">
                  {{ info.osVersion }}
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
                <bi name="server" />
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  Network and service settings
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
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Host</span>
                <span class="font-mono text-sm text-gray-900 dark:text-gray-100">
                  {{ info.host }}
                </span>
              </div>
              <div class="flex items-center justify-between py-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Port</span>
                <span class="font-mono text-sm text-gray-900 dark:text-gray-100">
                  {{ info.port }}
                </span>
              </div>
              <div class="flex items-center justify-between py-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Log Level</span>
                <span
                  class="rounded-md border border-gray-300 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  {{ info.logLevel }}
                </span>
              </div>
              <div class="flex items-center justify-between py-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Swagger API
                </span>
                <span [puStatusBadge]="info.swaggerEnabled">
                  {{ info.swaggerEnabled | statusText }}
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
                <bi name="envelope" />
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
                <span [puStatusBadge]="info.mailEnabled">
                  {{ info.mailEnabled | statusText }}
                </span>
              </div>
              <div class="flex items-center justify-between py-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Mail Host</span>
                <span class="font-mono text-sm text-gray-900 dark:text-gray-100">
                  {{ info.mailHost }}
                </span>
              </div>
              <div class="flex items-center justify-between py-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Mail Port</span>
                <span class="font-mono text-sm text-gray-900 dark:text-gray-100">
                  {{ info.mailPort }}
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
                <bi name="stars" />
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
                <span [puStatusBadge]="info.pushEnabled">
                  {{ info.pushEnabled | statusText }}
                </span>
              </div>
              <div class="flex items-center justify-between py-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Temporary Notifications
                </span>
                <span [puStatusBadge]="info.tempNotificationsEnabled">
                  {{ info.tempNotificationsEnabled | statusText }}
                </span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Rate Limiting -->
        <mat-card>
          <mat-card-header>
            <mat-card-title>
              <div class="mb-2 flex items-center gap-2">
                <bi name="shield-shaded" />
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
                <span [puStatusBadge]="info.rateLimitEnabled">
                  {{ info.rateLimitEnabled | statusText }}
                </span>
              </div>
              <div class="flex items-center justify-between py-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Duration</span>
                <span class="font-mono text-sm text-gray-900 dark:text-gray-100">
                  {{ info.rateLimitDurationInSeconds }} s
                </span>
              </div>
              <div class="flex items-center justify-between py-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Max Tries</span>
                <span class="font-mono text-sm text-gray-900 dark:text-gray-100">
                  {{ info.rateLimitTries }}
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
                <bi name="person-circle" />
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
              @for (provider of info.oauth2Providers; track provider.registrationId) {
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
                      <bi size="16" name="box-arrow-up-right" />
                      Docs
                    </a>
                  </div>

                  <div class="break-all font-mono text-xs text-gray-600 dark:text-gray-400">
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
                    <bi name="box-arrow-up-right" />
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
  providers: [provideBi(withSize('20'))],
  imports: [
    BiComponent,
    MatButton,
    StatusBadge,
    StatusText,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardSubtitle,
    MatCardContent,
  ],
})
export class InstanceSettingsInfoPage {
  info = inject(InfoStore).environment;
}
