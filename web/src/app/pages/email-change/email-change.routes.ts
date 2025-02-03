import {Routes} from '@angular/router';

export const ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: 'confirm/:confirmToken',
        loadComponent: () =>
          import('./email-change-confirm.page').then((c) => c.EmailChangeConfirmPage),
      },
      {
        path: 'undo/:cancelToken',
        loadComponent: () => import('./email-change-undo.page').then((c) => c.EmailChangeUndoPage),
      },
    ],
  },
];
