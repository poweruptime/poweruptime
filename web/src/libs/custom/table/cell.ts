import {Directive, InjectionToken, Input} from '@angular/core';

import {
  CdkCell,
  CdkCellDef,
  CdkColumnDef,
  CdkFooterCell,
  CdkFooterCellDef,
  CdkHeaderCell,
  CdkHeaderCellDef,
} from '@angular/cdk/table';

import {HlmTd, HlmTh} from '@spartan-ng/helm/table';

/**
 * Cell definition for the mat-table.
 * Captures the template of a column's data row cell as well as cell-specific properties.
 */
@Directive({
  selector: '[hlmCellDef]',
  providers: [{provide: CdkCellDef, useExisting: HlmCellDef}],
})
export class HlmCellDef extends CdkCellDef {}

/**
 * Header cell definition for the mat-table.
 * Captures the template of a column's header cell and as well as cell-specific properties.
 */
@Directive({
  selector: '[hlmHeaderCellDef]',
  providers: [{provide: CdkHeaderCellDef, useExisting: HlmHeaderCellDef}],
})
export class HlmHeaderCellDef extends CdkHeaderCellDef {}

/**
 * Footer cell definition for the mat-table.
 * Captures the template of a column's footer cell and as well as cell-specific properties.
 */
@Directive({
  selector: '[hlmFooterCellDef]',
  providers: [{provide: CdkFooterCellDef, useExisting: HlmFooterCellDef}],
})
export class HlmFooterCellDef extends CdkFooterCellDef {}

export const hlmSortHeaderColumnDef = new InjectionToken('HLM_SORT_HEADER_COLUMN_DEF');

/**
 * Column definition for the mat-table.
 * Defines a set of cells available for a table column.
 */
@Directive({
  selector: '[hlmColumnDef]',
  providers: [
    {provide: CdkColumnDef, useExisting: HlmColumnDef},
    {provide: hlmSortHeaderColumnDef, useExisting: HlmColumnDef},
  ],
})
export class HlmColumnDef extends CdkColumnDef {
  /** Unique name for this column. */
  @Input('hlmColumnDef')
  override get name(): string {
    return this._name;
  }
  override set name(name: string) {
    this._setNameInput(name);
  }

  /**
   * Add "mat-column-" prefix in addition to "cdk-column-" prefix.
   * In the future, this will only add "mat-column-" and columnCssClassName
   * will change from type string[] to string.
   * @docs-private
   */
  protected override _updateColumnCssClassName() {
    super._updateColumnCssClassName();
    this._columnCssClassName!.push(`hlm-column-${this.cssClassFriendlyName}`);
  }
}

/** Header cell template container that adds the right classes and role. */
@Directive({
  selector: 'hlm-header-cell, th[hlm-header-cell]',
  host: {
    role: 'columnheader',
  },
  hostDirectives: [HlmTh],
})
export class HlmHeaderCell extends CdkHeaderCell {}

/** Footer cell template container that adds the right classes and role. */
@Directive({
  selector: 'hlm-footer-cell, td[hlm-footer-cell]',
  hostDirectives: [HlmTd],
})
export class HlmFooterCell extends CdkFooterCell {}

/** Cell template container that adds the right classes and role. */
@Directive({
  selector: 'hlm-cell, td[hlm-cell]',
  hostDirectives: [HlmTd],
})
export class HlmCell extends CdkCell {}
