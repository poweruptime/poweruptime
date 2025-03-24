import {isPlatformServer} from '@angular/common';
import {PLATFORM_ID, inject} from '@angular/core';

import {environment} from '../../environments/environment';

export function injectIsPlatformDocker() {
  const isServer = isPlatformServer(inject(PLATFORM_ID));

  return environment.production && isServer;
}
