import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'booleanEmoji',
  pure: true,
})
export class BooleanEmojiPipe implements PipeTransform {
  transform(value: boolean) {
    return value ? '✅' : '❌';
  }
}
