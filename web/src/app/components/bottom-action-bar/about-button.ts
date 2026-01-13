import {ChangeDetectionStrategy, Component, inject} from '@angular/core';

import {MatMiniFabButton} from '@angular/material/button';

import {NgIcon} from '@ng-icons/core';
import {HlmDialogService} from '@spartan-ng/helm/dialog';

import {AboutDialog} from '../_dialog/about-dialog';

@Component({
  template: `
    <button (click)="openAbout()" type="button" mat-mini-fab>
      <ng-icon name="bootstrapInfoCircle" size="20" />
    </button>
  `,
  selector: 'pu-outside-about-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon, MatMiniFabButton],
})
export class OutsideAboutButton {
  private readonly dialog = inject(HlmDialogService);

  openAbout() {
    this.dialog.open(AboutDialog);
  }
}
