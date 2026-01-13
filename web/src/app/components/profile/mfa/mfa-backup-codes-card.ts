import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmCardImports} from '@spartan-ng/helm/card';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {DfxImplodePipe} from 'dfx-helper';

import {CopyIconButton} from '../../copy-icon-button';

@Component({
  template: `
    <section hlmCard>
      @let implodedBackupCodes = backupCodes() | s_implode: ', ';
      <div hlmCardHeader>
        <h3 hlmCardTitle>{{ 'general.backupCodes' | transloco }}</h3>
        <span hlmCardDescription>{{ 'mfa.backupCodes.description' | transloco }}</span>

        <div hlmCardAction>
          <pu-copy-icon-button [content]="implodedBackupCodes" />
        </div>
      </div>
      <div hlmCardContent>
        <div class="bg-muted/50 border-border rounded-lg border p-4">
          <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
            @for (backupCode of backupCodes(); track $index) {
              <div
                class="text-foreground bg-card border-border rounded border px-3 py-2 font-mono text-sm">
                {{ backupCode }}
              </div>
            }
          </div>
        </div>
        <p class="text-muted-foreground mt-3 text-xs leading-relaxed">
          Each code can only be used once. Store them securely - you'll need them if you lose access
          to your authenticator app.
        </p>
      </div>
      <div class="grid grid-cols-2 gap-2" hlmCardFooter>
        <button
          (click)="downloadTextFile(implodedBackupCodes, 'pu-backup-codes')"
          hlmBtn
          type="button"
          variant="outline">
          <ng-icon hlm size="sm" name="bootstrapDownload" />
          {{ 'general.download' | transloco }}
        </button>
        <button (click)="doneManagingBackupCodes.emit()" hlmBtn type="button">
          {{ 'general.done' | transloco }}
        </button>
      </div>
    </section>
  `,
  selector: 'pu-mfa-backup-codes-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CopyIconButton,
    DfxImplodePipe,
    TranslocoPipe,
    HlmButtonImports,
    HlmCardImports,
    HlmIconImports,
  ],
})
export class MFABackupCodesCard {
  backupCodes = input.required<string[]>();

  doneManagingBackupCodes = output();

  downloadTextFile(content: string, filename: string): void {
    const blob = new Blob([content], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `${filename}.txt`;
    link.click();

    URL.revokeObjectURL(url);
  }
}
