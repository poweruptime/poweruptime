import {inject} from '@angular/core';
import {Component} from '@angular/core';

import {filter} from 'rxjs';

import {TranslocoPipe} from '@jsverse/transloco';
import {BrnDialogClose, BrnDialogRef, injectBrnDialogContext} from '@spartan-ng/brain/dialog';
import {ButtonVariants, HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmDialogImports, HlmDialogService} from '@spartan-ng/helm/dialog';
import {DfxAutofocus} from 'dfx-helper';

interface ConfirmDialogContext {
  title: string;
  description?: string;
  btnVariant?: ButtonVariants['variant'];
}

@Component({
  template: `
    <hlm-dialog-header>
      <h3 hlmDialogTitle>{{ title }}</h3>
      @if (description; as description) {
        <p hlmDialogDescription>{{ description }}</p>
      }
    </hlm-dialog-header>

    <hlm-dialog-footer class="mt-8">
      <button type="button" hlmBtn variant="outline" brnDialogClose>
        {{ 'general.cancel' | transloco }}
      </button>
      <button [variant]="btnVariant" (click)="confirm()" type="button" hlmBtn focus>
        {{ 'general.confirm' | transloco }}
      </button>
    </hlm-dialog-footer>
  `,
  selector: 'pu-confirm-dialog',
  host: {
    class: 'sm:max-w-[425px]',
  },
  imports: [TranslocoPipe, HlmDialogImports, HlmButtonImports, BrnDialogClose, DfxAutofocus],
})
class ConfirmDialog {
  private readonly _dialogRef = inject<BrnDialogRef<true>>(BrnDialogRef);
  private readonly _dialogContext = injectBrnDialogContext<ConfirmDialogContext>();

  protected readonly title = this._dialogContext.title;
  protected readonly description = this._dialogContext.description;
  protected readonly btnVariant = this._dialogContext.btnVariant ?? 'default';

  public confirm() {
    this._dialogRef.close(true);
  }
}

export function injectConfirmDialog$() {
  const dialog = inject(HlmDialogService);

  return (title: string, description?: string) =>
    dialog
      .open(ConfirmDialog, {
        context: {
          title,
          description,
        } satisfies ConfirmDialogContext,
      })
      .closed$.pipe(filter((it): it is true => it === true));
}

export function injectConfirmDeleteDialog$() {
  const dialog = inject(HlmDialogService);

  return (title: string, description?: string) =>
    dialog
      .open(ConfirmDialog, {
        context: {
          title,
          description,
          btnVariant: 'destructive',
        } satisfies ConfirmDialogContext,
      })
      .closed$.pipe(filter((it): it is true => it === true));
}
