import {AbstractControl} from '@angular/forms';

export function passwordMatchValidator(control: AbstractControl): {mismatch: true} | null {
  const newPassword = control.get('newPassword')?.value as string | null;
  const confirmPassword = control.get('confirmPassword')?.value as string | null;

  return !!newPassword && !!confirmPassword && newPassword === confirmPassword
    ? null
    : {mismatch: true};
}
