# poweruptime-web

### Validators

```angular2html
@Component({
    template: `
      @if (checkResultRetentionPeriodInDaysErrors?.['required']) {
        <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
      }
      @if (checkResultRetentionPeriodInDaysErrors?.['min']; as min) {
        <mat-error>{{ 'form.validation.min' | transloco: min }}</mat-error>
      }
      @if (checkResultRetentionPeriodInDaysErrors?.['max']; as max) {
        <mat-error>{{ 'form.validation.max' | transloco: max }}</mat-error>
      }
      @if (checkResultRetentionPeriodInDaysErrors?.['pattern']) {
        <mat-error>{{ 'form.validation.integer' | transloco }}</mat-error>
      }
   `,
})
```
