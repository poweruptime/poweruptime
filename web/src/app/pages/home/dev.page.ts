import {NgOptimizedImage} from '@angular/common';
import {ChangeDetectionStrategy, Component, DOCUMENT, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';

import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmCardImports} from '@spartan-ng/helm/card';
import {HlmInputImports} from '@spartan-ng/helm/input';
import {HlmItemImports} from '@spartan-ng/helm/item';
import {HlmSelectImports} from '@spartan-ng/helm/select';
import {linkedQueryParam} from 'ngxtension/linked-query-param';

import {AuthStore, ChangelogStore} from '@app/services';

@Component({
  template: `
    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <div class="flex flex-col gap-4">
        <section hlmCard>
          <div hlmCardHeader>
            <h3 hlmCardTitle>Auth</h3>
          </div>
          <div class="flex gap-4" hlmCardContent>
            <button (click)="setInvalidAccessToken()" hlmBtn variant="outline" type="button">
              Access token invalidate
            </button>
            <button (click)="setInvalidRefreshToken()" hlmBtn variant="outline" type="button">
              Refresh token invalidate
            </button>
          </div>
        </section>

        <section hlmCard>
          <div hlmCardHeader>
            <h3 hlmCardTitle>OG Image</h3>
          </div>
          <div class="grid gap-6" hlmCardContent>
            <div class="flex gap-4">
              <hlm-select class="inline-block" [(value)]="ogType">
                <hlm-select-trigger class="w-56">
                  <hlm-select-value placeholder="Select an option" />
                </hlm-select-trigger>
                <hlm-select-content *hlmSelectPortal>
                  <hlm-select-group>
                    <hlm-select-item value="monitor">Monitor</hlm-select-item>
                    <hlm-select-item value="status">Status Page</hlm-select-item>
                  </hlm-select-group>
                </hlm-select-content>
              </hlm-select>
              <input
                class="w-80"
                [(ngModel)]="ogId"
                hlmInput
                type="text"
                placeholder="Monitor / status page id" />
            </div>
            @if (ogType() && ogId()) {
              <img
                class="h-auto w-92 rounded-md"
                [ngSrc]="
                  origin +
                  '/bff/v1/og/' +
                  (ogType() === 'monitor' ? 'monitor?id=' : 'status-page?slug=') +
                  ogId()
                "
                width="1200"
                height="630"
                alt="Social Preview" />
            }
          </div>
        </section>
      </div>
      <div>
        <section hlmCard>
          <div hlmCardHeader>
            <h3 hlmCardTitle>Preview</h3>
          </div>
          <div class="flex flex-col gap-8" hlmCardContent>
            <div class="flex flex-col gap-2">
              <h4>General</h4>
              <div class="flex flex-col gap-2">
                <div hlmItem variant="outline">
                  <div hlmItemContent>
                    <div hlmItemTitle>Not Found Page</div>
                  </div>
                  <div hlmItemActions>
                    <a
                      [queryParams]="{preview: true}"
                      routerLink="/not-found"
                      hlmBtn
                      type="button"
                      variant="outline"
                      size="sm">
                      Preview
                    </a>
                  </div>
                </div>
                <div hlmItem variant="outline">
                  <div hlmItemContent>
                    <div hlmItemTitle>Team Join Page</div>
                  </div>
                  <div hlmItemActions>
                    <a
                      [queryParams]="{preview: true}"
                      routerLink="/t/join/1234"
                      type="button"
                      hlmBtn
                      variant="outline"
                      size="sm">
                      Preview
                    </a>
                  </div>
                </div>
                <div hlmItem variant="outline">
                  <div hlmItemContent>
                    <div hlmItemTitle>Email Change Confirm Page</div>
                  </div>
                  <div hlmItemActions>
                    <a
                      [queryParams]="{preview: true}"
                      routerLink="/email-change/confirm/1234"
                      hlmBtn
                      type="button"
                      variant="outline"
                      size="sm">
                      Preview
                    </a>
                  </div>
                </div>

                <div hlmItem variant="outline">
                  <div hlmItemContent>
                    <div hlmItemTitle>Email Change Undo Page</div>
                  </div>
                  <div hlmItemActions>
                    <a
                      [queryParams]="{preview: true}"
                      routerLink="/email-change/undo/1234"
                      hlmBtn
                      type="button"
                      variant="outline"
                      size="sm">
                      Preview
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex flex-col gap-2">
              <h4>Auth</h4>
              <div class="flex flex-col gap-2">
                <div hlmItem variant="outline">
                  <div hlmItemContent>
                    <div hlmItemTitle>Login Page</div>
                  </div>
                  <div hlmItemActions>
                    <a
                      [queryParams]="{preview: true}"
                      routerLink="/auth/login"
                      hlmBtn
                      type="button"
                      variant="outline"
                      size="sm">
                      Preview
                    </a>
                  </div>
                </div>
                <div hlmItem variant="outline">
                  <div hlmItemContent>
                    <div hlmItemTitle>Forgot Password Page</div>
                  </div>
                  <div hlmItemActions>
                    <a
                      [queryParams]="{preview: true}"
                      hlmBtn
                      routerLink="/auth/forgot-password"
                      type="button"
                      variant="outline"
                      size="sm">
                      Preview
                    </a>
                  </div>
                </div>
                <div hlmItem variant="outline">
                  <div hlmItemContent>
                    <div hlmItemTitle>Password Change Page</div>
                  </div>
                  <div hlmItemActions>
                    <a
                      [queryParams]="{preview: true}"
                      routerLink="/auth/password-change"
                      hlmBtn
                      type="button"
                      variant="outline"
                      size="sm">
                      Preview
                    </a>
                  </div>
                </div>
                <div hlmItem variant="outline">
                  <div hlmItemContent>
                    <div hlmItemTitle>Setup Page</div>
                  </div>
                  <div hlmItemActions>
                    <a
                      [queryParams]="{preview: true}"
                      hlmBtn
                      type="button"
                      variant="outline"
                      size="sm"
                      routerLink="/setup">
                      Preview
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div>
        <section hlmCard>
          <div hlmCardHeader>
            <h3 hlmCardTitle>Changelog</h3>
          </div>
          <div hlmCardContent>
            <button (click)="setOldVersion()" hlmBtn variant="outline" type="button">
              Set old version into storage
            </button>
          </div>
        </section>
      </div>
    </div>
  `,
  selector: 'pu-profile-dev-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    HlmCardImports,
    HlmButtonImports,
    HlmItemImports,
    HlmSelectImports,
    HlmInputImports,
    FormsModule,
    NgOptimizedImage,
  ],
})
export class DevPage {
  private readonly authStore = inject(AuthStore);
  private readonly changelogStore = inject(ChangelogStore);

  private readonly document = inject(DOCUMENT);
  protected readonly origin = this.document.location.origin;

  protected readonly ogType = linkedQueryParam('og.type');
  protected readonly ogId = linkedQueryParam('og.id');

  setOldVersion() {
    this.changelogStore.lastVersion.set('0.0.1');
  }

  setInvalidAccessToken(): void {
    this.authStore.setTokens({
      accessToken:
        'eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJzZWxmIiwic3ViIjoiVHBYTG81UEZ5YkJ4IiwiZXhwIjoxNzM4MjUzNjI0LCJpYX' +
        'QiOjE3MzgyNTAwMjQsInNjb3BlIjoiUk9MRV9BRE1JTiJ9.JTJCzIHP4No2qHFQEt_s1hDJiTYobO48vebVj5WXcfOu_fP8F-fRporBXwmF' +
        'SGyC62STbKZjq8KfMlk-3sMVhu83nLxaGBSbUT8bzUMbY1gQqyeZW_i5uQ2LorQQ3teJr95F3TRq9J5A0ml-GhNzdkSUfG9O_2dbRKOYgO' +
        'WXk6MKBhhGVxFOKR99hUo-_ZQrzJPWTX3OBb4fbt39bo-3yz0ZrHZARRUwWDzeY4IMYFExNq1ayLaOWNAP9lszwFdWh8rv3izw9h3XKS5q' +
        'XTUhpnAVCQaD8F3usFxd5D1jjXxEp1eM-wUQykNmNn1ZF8IrSudNIIFiaYgenND2SCB82Q',
      refreshToken: this.authStore.refreshToken(),
    });
  }

  setInvalidRefreshToken(): void {
    this.authStore.setTokens({
      accessToken: this.authStore.accessToken()!,
      refreshToken:
        'eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJzZWxmIiwic3ViIjoiVHBYTG81UEZ5YkJ4IiwiZXhwIjoxNzQwODQ0MjUwLCJpYX' +
        'QiOjE3MzgyNTIyNTAsInNjb3BlIjoiUk9MRV9BRE1JTiJ9.k7xtxr-wpoXmTAJWiaBhP-2_NrEgRynafkVC6aaodqNIjorfrXFFEPBzAcrW' +
        '1LRhn8LT9upwaYSNE9ZZERHvY4K8j7NLQjyzTTCHs8qBny-T-f8MSj6xQP4Sy3UOM--l79Nyz1duyAQRzuDOZrlqLHpaHQyfC9ozO3hWKO_' +
        '6O-LUzkfJAUuc0YqA3wMBFFid6SIlGCJ7b5u4b3riYo7S6qIQgffLV7ozeNt-BDxny4aBfdFZiZRJG4nJAVi28derXAP_9J0AgCbNavcgr3B' +
        'jYTPv5uSZBfxXkz78BvzZ0pGKY1pCNBP1P9zTNe9UEPNbBaTMOaWwvzajc-qDk9z1jw',
    });
  }
}
