import {Location} from '@angular/common';
import {Component, inject} from '@angular/core';
import {MatAnchor, MatButton} from '@angular/material/button';
import {RouterLink} from '@angular/router';

import {TranslocoPipe} from '@jsverse/transloco';
import {BiComponent} from 'dfx-bootstrap-icons';

import {BottomActionBar} from '@app/components';

@Component({
  template: `
    <div class="flex min-h-screen flex-col items-center justify-center">
      <div
        class="container flex max-w-md flex-col items-center justify-center gap-14 px-4 py-16 text-center md:py-24">
        <bi name="question-octagon-fill" size="100" />
        <div class="flex flex-col gap-4 space-y-3">
          <h1 class="text-4xl font-bold tracking-tighter sm:text-5xl">
            {{ 'notFound.title' | transloco }}
          </h1>
          <p class="text-muted-foreground">{{ 'notFound.description' | transloco }}</p>
        </div>
        <div class="flex flex-col gap-2 min-[400px]:flex-row">
          <a mat-button routerLink="/">
            <bi class="me-2" name="house" />
            {{ 'notFound.home' | transloco }}
          </a>
          <button (click)="goBack()" mat-flat-button>
            <bi class="me-2" name="arrow-left" />
            {{ 'notFound.back' | transloco }}
          </button>
        </div>
      </div>
    </div>

    <pu-bottom-action-bar />
  `,
  selector: 'not-found-page',
  standalone: true,
  imports: [RouterLink, BiComponent, MatButton, MatAnchor, TranslocoPipe, BottomActionBar],
})
export class NotFoundPage {
  private readonly location = inject(Location);
  goBack(): void {
    this.location.back();
  }
}
