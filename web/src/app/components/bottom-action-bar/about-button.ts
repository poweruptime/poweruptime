import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {MatMiniFabButton} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';

import {BiComponent} from 'dfx-bootstrap-icons';

import {AboutDialog} from '@app/components/about-dialog';

@Component({
  template: `
    <button (click)="openAbout()" type="button" mat-mini-fab>
      <bi name="info-circle" size="20" />
    </button>
  `,
  selector: 'pu-outside-about-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BiComponent, MatMiniFabButton],
})
export class OutsideAboutButton {
  private dialog = inject(MatDialog);

  openAbout() {
    this.dialog.open(AboutDialog);
  }
}
