import {AsyncPipe} from '@angular/common';
import {Component, inject} from '@angular/core';
import {NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';

import {TranslocoPipe} from '@jsverse/transloco';
import {BrnDialogRef, injectBrnDialogContext} from '@spartan-ng/brain/dialog';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmFieldImports} from '@spartan-ng/helm/field';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmInputGroupImports} from '@spartan-ng/helm/input-group';
import {HlmSelectImports} from '@spartan-ng/helm/select';
import {HlmSpinnerImports} from '@spartan-ng/helm/spinner';

import {BackendType, Database} from '@app/api';
import {injectIsValid} from '@app/form';
import {TeamUsersStore} from '@app/services';

@Component({
  template: `
    <div class="flex flex-1 flex-col gap-4 overflow-y-auto">
      <div class="flex flex-col gap-2">
        <div class="flex size-11 items-center justify-center rounded-full border">
          <ng-icon hlm name="lucideUserPlus" size="sm" />
        </div>
        <div class="flex flex-col gap-1">
          <h2 class="text-lg leading-none font-semibold">{{ 'team.invite' | transloco }}</h2>
        </div>
      </div>
      @if (form.valueChanges | async) {}
      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="flex flex-col gap-3" formArrayName="members">
          @for (memberControl of form.controls.members.controls; track $index) {
            <div class="flex gap-2" [formGroup]="memberControl">
              <div class="flex flex-1 gap-2">
                <hlm-field class="w-56">
                  <div hlmInputGroup>
                    <input
                      id="email"
                      [placeholder]="'general.emailAddress' | transloco"
                      hlmInputGroupInput
                      formControlName="email"
                      type="email"
                      placeholder="you@example.com" />
                    <div hlmInputGroupAddon>
                      <ng-icon name="lucideMail" />
                    </div>
                  </div>
                  @let emailErrors = memberControl.controls.email.errors;
                  @if (emailErrors?.['required']) {
                    <hlm-field-error>{{ 'form.validation.required' | transloco }}</hlm-field-error>
                  }
                  @if (emailErrors?.['email']) {
                    <hlm-field-error>{{ 'form.validation.email' | transloco }}</hlm-field-error>
                  }
                  @if (emailErrors?.['minlength']; as minlength) {
                    <hlm-field-error>
                      {{ 'form.validation.minlength' | transloco: minlength }}
                    </hlm-field-error>
                  }
                  @if (emailErrors?.['maxlength']; as maxlength) {
                    <hlm-field-error>
                      {{ 'form.validation.maxlength' | transloco: maxlength }}
                    </hlm-field-error>
                  }
                </hlm-field>
                <hlm-select class="inline-block" formControlName="role">
                  <hlm-select-trigger class="w-28">
                    <hlm-select-value [placeholder]="'general.role' | transloco" />
                  </hlm-select-trigger>
                  <hlm-select-content *hlmSelectPortal>
                    <hlm-select-group>
                      <hlm-select-item value="ADMIN">
                        <ng-icon class="mr-1" name="bootstrapStarFill" />
                        {{ 'general.admin' | transloco }}
                      </hlm-select-item>
                      <hlm-select-item value="MEMBER">
                        {{ 'general.member' | transloco }}
                      </hlm-select-item>
                    </hlm-select-group>
                  </hlm-select-content>
                </hlm-select>
              </div>
              @if (form.controls.members.length > 1) {
                <button
                  class="size-9 shrink-0"
                  (click)="removeMember($index)"
                  hlmBtn
                  type="button"
                  variant="ghost"
                  size="icon">
                  <ng-icon hlm name="lucideTrash2" size="sm" />
                </button>
              }
            </div>

            @let memberErrors = memberControl.errors;
            @if (memberErrors?.['mailNotFound']) {
              <hlm-field-error>Mail not found on poweruptime</hlm-field-error>
            }
            @if (memberErrors?.['rateLimitExceeded']) {
              <hlm-field-error>User can't be invited for some time</hlm-field-error>
            }
            @if (memberErrors?.['personalTeam']) {
              <hlm-field-error>User can't be invited to a personal team</hlm-field-error>
            }
            @if (memberErrors?.['alreadyInTeam']) {
              <hlm-field-error>User is already a member of the team</hlm-field-error>
            }
            @if (memberErrors?.['unknownError']) {
              <hlm-field-error>Unknown error</hlm-field-error>
            }
          }
          <button
            class="text-muted-foreground hover:text-primary w-fit cursor-pointer text-sm underline hover:no-underline"
            (click)="addMember()"
            hlmBtn
            variant="link"
            type="button">
            + Add another
          </button>
          <button
            [disabled]="!isValid() || teamUsersStore.isPending()"
            hlmBtn
            type="submit"
            size="sm">
            @if (teamUsersStore.isPending()) {
              <hlm-spinner class="mr-2 size-4" />
            }
            <ng-icon hlm size="sm" name="lucideSend" />
            {{ 'general.invite' | transloco }}
          </button>
        </div>
      </form>
    </div>
  `,
  host: {
    class:
      'top-1/2 left-1/2 flex max-h-[calc(100vh-2rem)] w-full max-w-[calc(100%-2rem)] flex-col overflow-hidden rounded-lg p-0 sm:max-h-[min(640px,80vh)] sm:max-w-[400px]',
  },
  selector: 'pu-team-invite-dialog',
  imports: [
    ReactiveFormsModule,
    TranslocoPipe,
    AsyncPipe,
    HlmIconImports,
    HlmButtonImports,
    HlmSelectImports,
    HlmInputGroupImports,
    HlmSpinnerImports,
    HlmFieldImports,
  ],
})
export class TeamInviteDialog {
  private readonly dialogRef = inject(BrnDialogRef);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly dialogContext = injectBrnDialogContext<{teamId: string}>();
  protected readonly teamUsersStore = inject(TeamUsersStore);

  protected readonly form = this.fb.group({
    members: this.fb.array(
      [1].map(() =>
        this.fb.group({
          role: ['MEMBER' as BackendType['InviteTeamUserDto']['role'], [Validators.required]],
          email: [
            '',
            [
              Validators.required,
              Validators.email,
              Validators.minLength(Database.MIN_MAIL_LENGTH),
              Validators.maxLength(Database.MAX_MAIL_LENGTH),
            ],
          ],
        }),
      ),
      [Validators.required],
    ),
  });

  isValid = injectIsValid(this.form);

  addMember(): void {
    this.form.controls.members.push(
      this.fb.group({
        role: ['MEMBER' as BackendType['InviteTeamUserDto']['role'], [Validators.required]],
        email: [
          '',
          [
            Validators.required,
            Validators.email,
            Validators.minLength(Database.MIN_MAIL_LENGTH),
            Validators.maxLength(Database.MAX_MAIL_LENGTH),
          ],
        ],
      }),
    );
  }

  removeMember(index: number): void {
    this.form.controls.members.removeAt(index, {emitEvent: true});
  }

  submit() {
    void this.teamUsersStore.invite({
      dialogRef: this.dialogRef,
      membersForm: this.form.controls.members,
      teamId: this.dialogContext.teamId,
      members: this.form.getRawValue().members,
    });
  }
}
