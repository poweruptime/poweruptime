import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';

import {loggerOf} from 'dfts-helper';

const focuses = ['input', 'select', 'textarea'];

@Component({
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export abstract class AbstractModelEditFormComponent<
  CreateDTOType,
  UpdateDTOType,
> implements AfterViewInit {
  lumber = loggerOf('AModelEditForm');

  fb = inject(FormBuilder);

  readonly submitCreate = output<CreateDTOType>();

  readonly submitUpdate = output<UpdateDTOType>();

  isCreating = signal(true);
  protected readonly disableInputFocus: boolean = false;

  abstract form: FormGroup;
  formRef = viewChild<ElementRef>('formRef');

  @Input()
  set formDisabled(it: boolean) {
    if (it) {
      this.form.disable();
    }

    this.lumber.log('setFormDisabled', 'Disabled', it);
  }

  ngAfterViewInit(): void {
    if (this.isCreating() && !this.disableInputFocus) {
      this.setInputFocus();
    }
  }

  protected overrideRawValue(value: ReturnType<typeof this.form.value>): unknown {
    return value;
  }

  private setInputFocus(): void {
    const input: HTMLElement = this.formRef()?.nativeElement.querySelector(focuses.join(','));
    if (input) {
      input.focus();
      this.lumber.log('setInputFocus', 'Input to focus', input);
    } else {
      this.lumber.log('setInputFocus', 'No input found to focus');
    }
  }

  submit(): void {
    const formValue = this.overrideRawValue(this.form.getRawValue());
    if (this.isCreating()) {
      this.submitCreate.emit(formValue as CreateDTOType);
      return;
    }
    this.submitUpdate.emit(formValue as UpdateDTOType);
  }

  reset(): void {
    this.lumber.log('reset', 'Reset form');
    this.form.reset();
    this.setInputFocus();
  }
}
