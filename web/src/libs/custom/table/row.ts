import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ViewEncapsulation,
  booleanAttribute,
} from '@angular/core';

import {
  CdkCellOutlet,
  CdkFooterRow,
  CdkFooterRowDef,
  CdkHeaderRow,
  CdkHeaderRowDef,
  CdkRow,
  CdkRowDef,
} from '@angular/cdk/table';

import {HlmTh, HlmTr} from '@spartan-ng/helm/table';

// We can't reuse `CDK_ROW_TEMPLATE` because it's incompatible with local compilation mode.
const ROW_TEMPLATE = `<ng-container cdkCellOutlet></ng-container>`;

/**
 * Header row definition for the mat-table.
 * Captures the header row's template and other header properties such as the columns to display.
 */
@Directive({
  selector: '[hlmHeaderRowDef]',
  providers: [{provide: CdkHeaderRowDef, useExisting: HlmHeaderRowDef}],
  inputs: [
    {name: 'columns', alias: 'hlmHeaderRowDef'},
    {name: 'sticky', alias: 'hlmHeaderRowDefSticky', transform: booleanAttribute},
  ],
})
export class HlmHeaderRowDef extends CdkHeaderRowDef {}

/**
 * Footer row definition for the mat-table.
 * Captures the footer row's template and other footer properties such as the columns to display.
 */
@Directive({
  selector: '[hlmFooterRowDef]',
  providers: [{provide: CdkFooterRowDef, useExisting: HlmFooterRowDef}],
  inputs: [
    {name: 'columns', alias: 'hlmFooterRowDef'},
    {name: 'sticky', alias: 'hlmFooterRowDefSticky', transform: booleanAttribute},
  ],
})
export class HlmFooterRowDef extends CdkFooterRowDef {}

/**
 * Data row definition for the hlm-data-table.
 * Captures the data row's template and other properties such as the columns to display and
 * a when predicate that describes when this row should be used.
 */
@Directive({
  selector: '[hlmRowDef]',
  providers: [{provide: CdkRowDef, useExisting: HlmRowDef}],
  inputs: [
    {name: 'columns', alias: 'hlmRowDefColumns'},
    {name: 'when', alias: 'hlmRowDefWhen'},
  ],
})
export class HlmRowDef<T> extends CdkRowDef<T> {}

/** Header template container that contains the cell outlet. Adds the right class and role. */
@Component({
  selector: 'hlm-header-row, tr[hlm-header-row]',
  template: ROW_TEMPLATE,
  host: {
    role: 'row',
  },
  hostDirectives: [HlmTh],
  // See note on CdkTable for explanation on why this uses the default change detection strategy.
  // tslint:disable-next-line:validate-decorators
  changeDetection: ChangeDetectionStrategy.Default,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'hlmHeaderRow',
  providers: [{provide: CdkHeaderRow, useExisting: HlmHeaderRow}],
  imports: [CdkCellOutlet],
})
export class HlmHeaderRow extends CdkHeaderRow {}

/** Footer template container that contains the cell outlet. Adds the right class and role. */
@Component({
  selector: 'hlm-footer-row, tr[hlm-footer-row]',
  template: ROW_TEMPLATE,
  host: {
    role: 'row',
  },
  hostDirectives: [HlmTr],
  // See note on CdkTable for explanation on why this uses the default change detection strategy.
  // tslint:disable-next-line:validate-decorators
  changeDetection: ChangeDetectionStrategy.Default,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'hlmFooterRow',
  providers: [{provide: CdkFooterRow, useExisting: HlmFooterRow}],
  imports: [CdkCellOutlet],
})
export class HlmFooterRow extends CdkFooterRow {}

/** Data row template container that contains the cell outlet. Adds the right class and role. */
@Component({
  selector: 'hlm-row, tr[hlm-row]',
  template: ROW_TEMPLATE,
  host: {
    role: 'row',
  },
  hostDirectives: [HlmTr],
  // See note on CdkTable for explanation on why this uses the default change detection strategy.
  // tslint:disable-next-line:validate-decorators
  changeDetection: ChangeDetectionStrategy.Default,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'hlmRow',
  providers: [{provide: CdkRow, useExisting: HlmRow}],
  imports: [CdkCellOutlet],
})
export class HlmRow extends CdkRow {}
