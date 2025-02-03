import {inject} from '@angular/core';
import {NonNullableFormBuilder, Validators} from '@angular/forms';

import {createInjectable} from 'ngxtension/create-injectable';

import {BackendType, Database} from '@app/api';

const baseCheckerProperties = {
  id: [undefined as string | undefined],
  _type: [''],
};

export const NotificationMethodEditFormDataService = createInjectable(() => {
  const fb = inject(NonNullableFormBuilder);

  const emailDataFormGroup = fb.group({
    ...baseCheckerProperties,
    to: [
      '',
      [
        Validators.required,
        Validators.email,
        Validators.minLength(Database.MIN_MAIL_LENGTH),
        Validators.maxLength(Database.MAX_MAIL_LENGTH),
      ],
    ],
    host: [
      '',
      [
        Validators.required,
        Validators.pattern(
          '(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]',
        ),
        Validators.minLength(Database.MIN_DOMAIN_LENGTH),
        Validators.maxLength(Database.MAX_DOMAIN_LENGTH),
      ],
    ],
    port: [
      587,
      [Validators.required, Validators.min(Database.MIN_PORT), Validators.max(Database.MAX_PORT)],
    ],
    username: [
      undefined as string | undefined,
      [Validators.maxLength(Database.MAX_BASIC_AUTH_LENGTH)],
    ],
    password: [
      undefined as string | undefined,
      [Validators.maxLength(Database.MAX_BASIC_AUTH_LENGTH)],
    ],
  });

  const discordDataFormGroup = fb.group({
    ...baseCheckerProperties,
    url: [
      '',
      [
        Validators.required,
        Validators.pattern(
          'https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)',
        ),
        Validators.minLength(Database.MIN_DOMAIN_LENGTH),
        Validators.maxLength(Database.MAX_DOMAIN_LENGTH),
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
});
