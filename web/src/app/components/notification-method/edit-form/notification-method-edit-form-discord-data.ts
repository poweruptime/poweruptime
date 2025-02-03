import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';

import {NotificationMethodEditFormDataService} from './notification-method-edit-form-data.service';

@Component({
  selector: 'pu-notification-method-edit-form-discord-data',
  template: `
    <div class="flex flex-col gap-4" [formGroup]="discordDataFormGroup">
      <mat-form-field>
        <mat-label>URL</mat-label>
        <input matInput type="text" formControlName="url" />
      </mat-form-field>

      <mat-form-field>
        <mat-label>Displayname</mat-label>
        <input matInput formControlName="displayName" />
      </mat-form-field>
    </div>
  `,
  imports: [ReactiveFormsModule, MatFormField, MatInput, MatLabel],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationMethodEditFormDiscordData {
  discordDataFormGroup = inject(NotificationMethodEditFormDataService).discordDataFormGroup;
}
