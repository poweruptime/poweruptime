# poweruptime-web

### Validators

```angular2html
@Component({
    template: `
      @if (errors?.['required']) {
        <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
      }
      @if (errors?.['min']; as min) {
        <mat-error>{{ 'form.validation.min' | transloco: min }}</mat-error>
      }
      @if (errors?.['max']; as max) {
        <mat-error>{{ 'form.validation.max' | transloco: max }}</mat-error>
      }
      @if (errors?.['pattern']) {
        <mat-error>{{ 'form.validation.integer' | transloco }}</mat-error>
      }

      @if (errors?.['minlength']; as minlength) {
        <mat-error>{{ 'form.validation.minlength' | transloco: minlength }}</mat-error>
      }
      @if (errors?.['maxlength']; as maxlength) {
        <mat-error>{{ 'form.validation.maxlength' | transloco: maxlength }}</mat-error>
      }
   `,
})
```
