# poweruptime-web

### Validators

```angular2html
@Component({
    template: `
      @if (errors?.['required']) {
        <hlm-error>{{ 'form.validation.required' | transloco }}</hlm-error>
      }
      @if (errors?.['min']; as min) {
        <hlm-error>{{ 'form.validation.min' | transloco: min }}</hlm-error>
      }
      @if (errors?.['max']; as max) {
        <hlm-error>{{ 'form.validation.max' | transloco: max }}</hlm-error>
      }
      @if (errors?.['pattern']) {
        <hlm-error>{{ 'form.validation.integer' | transloco }}</hlm-error>
      }

      @if (errors?.['minlength']; as minlength) {
        <hlm-error>{{ 'form.validation.minlength' | transloco: minlength }}</hlm-error>
      }
      @if (errors?.['maxlength']; as maxlength) {
        <hlm-error>{{ 'form.validation.maxlength' | transloco: maxlength }}</hlm-error>
      }
   `,
})
```
