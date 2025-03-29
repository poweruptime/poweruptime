import {inject} from '@angular/core';
import {FormControl, NonNullableFormBuilder, Validators} from '@angular/forms';

import {createInjectable} from 'ngxtension/create-injectable';

import {BackendType, Database} from '@app/api';
import {arrayItemMaxLength, arrayItemMinLength} from '@app/form';

const baseCheckerProperties = {
  id: [undefined as string | undefined],
  _type: [''],
};

export const NotificationMethodEditFormDataService = createInjectable(
  () => {
    const fb = inject(NonNullableFormBuilder);

    const emailDataFormGroup = fb.group({
      ...baseCheckerProperties,
      to: new FormControl<string[] | null>(null, [
        Validators.required,
        arrayItemMinLength(Database.MIN_MAIL_LENGTH),
        arrayItemMaxLength(Database.MAX_MAIL_LENGTH),
      ]),
      host: [
        '',
        [
          Validators.required,
          Validators.pattern(Database.DOMAIN_REGEX),
          Validators.minLength(Database.MIN_DOMAIN_LENGTH),
          Validators.maxLength(Database.MAX_DOMAIN_LENGTH),
        ],
      ],
      port: [
        587,
        [
          Validators.required,
          Validators.min(Database.MIN_PORT),
          Validators.max(Database.MAX_PORT),
          Validators.pattern(Database.INTEGER_REGEX),
        ],
      ],
      username: [
        undefined as string | undefined,
        [Validators.maxLength(Database.MAX_BASIC_AUTH_LENGTH)],
      ],
      password: [
        undefined as string | undefined,
        [Validators.maxLength(Database.MAX_BASIC_AUTH_LENGTH)],
      ],
      security: ['NONE_STARTTLS' as 'NONE_STARTTLS' | 'TLS', [Validators.required]],
      ignoreTLSErrors: [false],
      cc: new FormControl<string[] | null>(null, [
        arrayItemMinLength(Database.MIN_MAIL_LENGTH),
        arrayItemMaxLength(Database.MAX_MAIL_LENGTH),
      ]),
      bcc: new FormControl<string[] | null>(null, [
        arrayItemMinLength(Database.MIN_MAIL_LENGTH),
        arrayItemMaxLength(Database.MAX_MAIL_LENGTH),
      ]),
    });

    const discordDataFormGroup = fb.group({
      ...baseCheckerProperties,
      url: [
        '',
        [
          Validators.required,
          Validators.pattern(Database.URL_REGEX),
          Validators.minLength(Database.MIN_URL_LENGTH),
          Validators.maxLength(Database.MAX_URL_LENGTH),
        ],
      ],
      displayName: [
        undefined as string | undefined,
        [
          Validators.minLength(Database.MIN_DISCORD_DISPLAY_NAME_LENGTH),
          Validators.maxLength(Database.MAX_DISCORD_DISPLAY_NAME_LENGTH),
        ],
      ],
    });

    return {
      emailDataFormGroup,
      discordDataFormGroup,
      formCheckerFactory: (type: BackendType['NotificationSenderData']['_type']) => {
        switch (type) {
          case 'EMAIL':
            return emailDataFormGroup;
          case 'DISCORD':
            return discordDataFormGroup;
          default:
            throw `Unsupported type "${type}"`;
        }
      },
    };
  },
  {providedIn: 'scoped'},
);
