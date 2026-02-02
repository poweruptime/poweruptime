import {Pipe, PipeTransform} from '@angular/core';

import {BACKEND_API_URL} from '../util';

@Pipe({
  name: 'backendImage',
  pure: true,
})
export class BackendImagePipe implements PipeTransform {
  transform<T>(fileId: T) {
    if (!fileId) {
      return fileId;
    }
    return BACKEND_API_URL + '/v1/public/file/' + fileId;
  }
}
