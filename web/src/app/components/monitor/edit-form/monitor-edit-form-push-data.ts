import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {ReactiveFormsModule} from '@angular/forms';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmFormFieldImports} from '@spartan-ng/helm/form-field';
import {HlmInputGroupImports} from '@spartan-ng/helm/input-group';
import {HlmLabelImports} from '@spartan-ng/helm/label';

import {CopyIconButton} from '@app/components';

import {MonitorEditFormDataService} from './monitor-edit-form-data.service';

@Component({
  template: `
    <div class="flex flex-col gap-4" [formGroup]="pushDataFormGroup">
      <hlm-form-field class="col-span-8">
        <label hlmLabel for="url">{{ 'monitor.edit.pushUrl' | transloco }}</label>
        <div hlmInputGroup>
          <input id="url" [value]="pushUrl()" hlmInputGroupInput readonly type="url" />
          <div hlmInputGroupAddon align="inline-end">
            <pu-copy-icon-button [content]="pushUrl()" />
          </div>
        </div>
      </hlm-form-field>
    </div>
  `,
  selector: 'pu-monitor-edit-form-push-data',
  imports: [
    CopyIconButton,
    ReactiveFormsModule,
    TranslocoPipe,
    HlmFormFieldImports,
    HlmLabelImports,
    HlmInputGroupImports,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonitorEditFormPushData {
  pushDataFormGroup = inject(MonitorEditFormDataService).pushDataFormGroup;

  pushId = toSignal(this.pushDataFormGroup.controls['pushId'].valueChanges, {
    initialValue: this.pushDataFormGroup.controls['pushId'].value,
  });

  pushUrl = computed(
    () =>
      `https://${window.location.host}/api/v1/public/push/${this.pushId()}?status=UP&title=OK&message=&pingMs=`,
  );
}
