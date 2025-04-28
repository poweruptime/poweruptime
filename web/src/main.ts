import {bootstrapApplication} from '@angular/platform-browser';

import {AppComponent} from '@app/app.component';
import {appConfig} from '@app/app.config';

import {environment} from './environments/environment';

bootstrapApplication(AppComponent, appConfig)
  .then(() => console.log('Application bootstrapped', environment))
  .catch((err) => console.error(err));
