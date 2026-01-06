import {ChangeDetectionStrategy, Component} from '@angular/core';

import {UserList} from '@app/components/user';

@Component({
  template: `
    <pu-user-list />
  `,
  selector: 'pu-instance-settings-users-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UserList],
})
export class InstanceSettingsUsersPage {}
