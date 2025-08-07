import {ChangeDetectionStrategy, Component, input} from '@angular/core';

import {MatCard, MatCardContent} from '@angular/material/card';
import {MatTab, MatTabGroup} from '@angular/material/tabs';

import {TranslocoPipe} from '@jsverse/transloco';

import {CheckResultList} from './check-result';
import {NotificationList} from './notification-list';

@Component({
  template: `
    <mat-card appearance="outlined">
      <mat-card-content>
        <mat-tab-group mat-stretch-tabs="false" mat-align-tabs="start">
          <mat-tab [label]="'general.notifications' | transloco">
            <pu-notification-list [teamId]="teamId()" [monitorId]="monitorId()" />
          </mat-tab>
          <mat-tab [label]="'checkResult.list.title' | transloco">
            <pu-check-result-list [teamId]="teamId()" [monitorId]="monitorId()" />
          </mat-tab>
        </mat-tab-group>
      </mat-card-content>
    </mat-card>
  `,

  selector: 'pu-notification-check-result-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    MatCardContent,
    CheckResultList,
    NotificationList,
    MatTab,
    MatTabGroup,
    TranslocoPipe,
  ],
})
export class NotificationCheckResultCard {
  readonly monitorId = input<string>();
  readonly teamId = input<string>();
}
