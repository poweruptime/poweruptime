import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {MatAnchor, MatButton} from '@angular/material/button';
import {MatCard, MatCardContent} from '@angular/material/card';
import {RouterLink} from '@angular/router';

import {AuthStore} from '@app/services';

@Component({
  template: `
    <div class="grid gap-4 md:grid-cols-3">
      <div>
        <mat-card appearance="outlined">
          <mat-card-content>
            <div class="flex flex-col gap-4">
              <h2 class="text-xl">Auth</h2>
              <button class="secondary-button" (click)="setInvalidAccessToken()" mat-flat-button>
                Access token invalidate
              </button>
              <button class="secondary-button" (click)="setInvalidRefreshToken()" mat-flat-button>
                Refresh token invalidate
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
      <div>
        <mat-card appearance="outlined">
          <mat-card-content>
            <div class="flex flex-col gap-4">
              <h2 class="text-xl">Preview</h2>
              <a
                class="secondary-button"
                [queryParams]="{preview: true}"
                mat-flat-button
                routerLink="/auth/login">
                Open Login
              </a>
              <a
                class="secondary-button"
                [queryParams]="{preview: true}"
                mat-flat-button
                routerLink="/auth/forgot-password">
                Open Forgot Password
              </a>
              <a
                class="secondary-button"
                [queryParams]="{preview: true}"
                mat-flat-button
                routerLink="/auth/password-change">
                Open Password Change
              </a>
              <a
                class="secondary-button"
                [queryParams]="{preview: true}"
                mat-flat-button
                routerLink="/setup">
                Open Setup
              </a>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  selector: 'pu-profile-dev-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCard, MatCardContent, MatButton, MatAnchor, RouterLink],
})
export class ProfileDevPage {
  private readonly authStore = inject(AuthStore);

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
