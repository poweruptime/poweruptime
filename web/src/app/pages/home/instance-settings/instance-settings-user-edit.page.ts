import {ChangeDetectionStrategy, Component, inject, input} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';

import {Placeholder} from '@app/components';
import {UserEditForm} from '@app/components/user';
import {UserEditStore} from '@app/services';

@Component({
  template: `
    <div class="flex flex-col gap-4">
      @let user = userEditStore.user();
      @let _userId = userId();

      @if (_userId) {
        @if (user; as user) {
          <h1 class="text-4xl">{{ 'instanceSettings.editUser' | transloco: user }}</h1>
        } @else {
          <pu-placeholder class="h-12 w-64" />
        }
      } @else {
        <h1 class="text-4xl">{{ 'instanceSettings.inviteUser' | transloco }}</h1>
      }

      @if (_userId) {
        @if (userEditStore.isFulfilled()) {
          <pu-user-edit-form
            class="w-full"
            [user]="user"
            (submitCreate)="userEditStore.create($event)"
            (submitUpdate)="userEditStore.update($event)" />
        } @else {
          <div class="animate-puls flex flex-col gap-3">
            <div class="flex justify-between gap-2">
              <pu-placeholder class="h-14 w-64" />
              <pu-placeholder class="h-14 w-64" />
            </div>

            <pu-placeholder class="flex h-48" />
            <pu-placeholder class="flex h-48" />
          </div>
        }
      } @else {
        <pu-user-edit-form
          [user]="undefined"
          (submitCreate)="userEditStore.create($event)"
          (submitUpdate)="userEditStore.update($event)" />
      }
    </div>
  `,
  selector: 'pu-instance-settings-user-edit-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [UserEditStore],
  imports: [UserEditForm, Placeholder, TranslocoPipe],
})
export class InstanceSettingsUserEditPage {
  readonly userEditStore = inject(UserEditStore);

  readonly userId = input.required<string>();

  constructor() {
    this.userEditStore.loadById(this.userId);
  }
}
