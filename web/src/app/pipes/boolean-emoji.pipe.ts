import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'puBooleanEmoji',
  pure: true,
})
export class PuBooleanEmojiPipe implements PipeTransform {
  transform(value: boolean) {
    return value ? '✅' : '❌';
  }
}
