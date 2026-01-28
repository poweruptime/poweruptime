import {Directive, input} from '@angular/core';

@Directive({
  selector: '[brnMentionLabel]',
  host: {
    '[id]': 'id()',
  },
})
export class BrnMentionLabel {
  private static _id = 0;

  /** The id of the mention label */
  public readonly id = input<string>(`brn-mention-label-${++BrnMentionLabel._id}`);
}
