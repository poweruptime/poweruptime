import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';

import {MatButton} from '@angular/material/button';
import {MatDialogActions, MatDialogClose, MatDialogContent} from '@angular/material/dialog';
import {MatFormField, MatInput} from '@angular/material/input';

import {CdkTextareaAutosize} from '@angular/cdk/text-field';

import {TranslocoPipe} from '@jsverse/transloco';
import {cl_copy} from 'dfts-helper';

import {environment} from '@app/util';

import {InfoStore, InstanceSettingsStore} from '../services';

@Component({
  template: `
    <mat-dialog-content>
      <div class="flex justify-between gap-4">
        <h2 class="text-3xl">Debug information</h2>
        <button (click)="copy()" type="button" mat-stroked-button>Copy</button>
      </div>

      <mat-form-field class="mt-6 w-full">
        <textarea
          class="w-full"
          #autosize="cdkTextareaAutosize"
          [value]="info()"
          matInput
          cdkTextareaAutosize
          readonly></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button type="button" mat-button mat-dialog-close>{{ 'general.close' | transloco }}</button>
    </mat-dialog-actions>
  `,
  selector: 'pu-debug-info-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogContent,
    MatDialogActions,
    MatButton,
    MatDialogClose,
    TranslocoPipe,
    MatFormField,
    CdkTextareaAutosize,
    MatInput,
  ],
})
export class DebugInfoDialog {
  private readonly infoStore = inject(InfoStore);
  private readonly instanceSettingsStore = inject(InstanceSettingsStore);

  private header(it: string): string {
    return `============ ${it} ============`;
  }

  info = computed(() => {
    const instanceSettings = this.instanceSettingsStore.settings();

    return `${this.header('INFO')}
Client-Time: ${new Date().toISOString()}
Client-Version: ${environment.version}
BA-Version: ${this.infoStore.version()}

BA-Time: ${this.infoStore.time()?.serverTime}
Start-Time: ${this.infoStore.time()?.serverStartTime}
Setup-Time: ${this.infoStore.time()?.serverSetupTime}
Enabled OAuth2 Providers: ${this.infoStore.oauth2Providers()?.reduce((acc, it) => acc + ` ${it.clientName}`, '') ?? 'None'}
Is-Setup: ${this.infoStore.isSetup()}
Is Supporter: ${this.infoStore.support()?.supportsSince != null}

${this.header('Instance settings')}
isUserAllowedToCreateTeams: ${instanceSettings?.isUserAllowedToCreateTeams}
Show supporter badge: ${this.infoStore.support()?.showSupportBadge}
Timezone: ${instanceSettings?.timezone}

Version check enabled: ${instanceSettings?.versionCheckEnabled}
Show new version dialog: ${instanceSettings?.showNewVersionDialog}
Version check admin mail: ${instanceSettings?.versionCheckAdminMailEnabled}

Check result retention in days: ${instanceSettings?.checkResultRetentionPeriodInDays}
Check result log retention in days: ${instanceSettings?.checkResultLogRetentionPeriodInDays}

${this.header('Environment')}
${JSON.stringify(this.infoStore.environment(), null, 2)}
`;
  });

  constructor() {
    this.infoStore.loadVersion();
    this.infoStore.loadOAuth2Providers();
    this.infoStore.loadIsSetup();
    this.infoStore.loadSupport();
    this.infoStore.loadTime();
    this.infoStore.loadEnvironment();

    this.instanceSettingsStore.load();
  }

  copy() {
    cl_copy(this.info());
  }
}
