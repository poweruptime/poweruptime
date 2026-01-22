import {Location} from '@angular/common';
import {Component, inject} from '@angular/core';
import {RouterLink} from '@angular/router';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmIconImports} from '@spartan-ng/helm/icon';

import {OutsideBottomActions} from '@app/components';

@Component({
  template: `
    <div class="flex min-h-screen flex-col items-center justify-center">
      <div
        class="container flex max-w-md flex-col items-center justify-center gap-14 px-4 py-16 text-center md:py-24">
        <ng-icon name="bootstrapQuestionOctagonFill" size="100" />
        <div class="flex flex-col gap-4 space-y-3">
          <h1 class="text-4xl font-bold tracking-tighter sm:text-5xl">
            {{ 'notFound.title' | transloco }}
          </h1>
          <p class="text-muted-foreground">{{ 'notFound.description' | transloco }}</p>
        </div>
        <div class="flex flex-col gap-2 min-[400px]:flex-row">
          <a hlmBtn variant="outline" routerLink="/">
            <ng-icon hlm size="sm" name="bootstrapHouse" />
            {{ 'notFound.home' | transloco }}
          </a>
          <button (click)="goBack()" type="button" hlmBtn>
            <ng-icon hlm size="sm" name="bootstrapArrowLeft" />
            {{ 'notFound.back' | transloco }}
          </button>
        </div>
      </div>
    </div>

    <pu-outside-bottom-actions />
  `,
  selector: 'not-found-page',
  standalone: true,
  imports: [RouterLink, TranslocoPipe, OutsideBottomActions, HlmButtonImports, HlmIconImports],
})
export class NotFoundPage {
  private readonly location = inject(Location);
  goBack(): void {
    this.location.back();
  }
}
