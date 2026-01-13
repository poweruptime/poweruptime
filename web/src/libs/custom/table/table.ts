import {ChangeDetectionStrategy, Component, ViewEncapsulation} from '@angular/core';

import {_DisposeViewRepeaterStrategy, _VIEW_REPEATER_STRATEGY} from '@angular/cdk/collections';
import {
  CDK_TABLE,
  CdkTable,
  DataRowOutlet,
  FooterRowOutlet,
  HeaderRowOutlet,
  NoDataRowOutlet,
  STICKY_POSITIONING_LISTENER,
} from '@angular/cdk/table';

import {HlmTBody, HlmTFoot, HlmTHead, HlmTable} from '@spartan-ng/helm/table';

/**
 * Wrapper for the CdkTable with Bootstrap styles.
 */
@Component({
  selector: 'table[hlm-data-table]',
  exportAs: 'ngbDataTable',
  // Note that according to MDN, the `caption` element has to be projected as the **first**
  // element in the table. See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/caption
  // We can't reuse `CDK_TABLE_TEMPLATE` because it's incompatible with local compilation mode.
  template: `
    <ng-content select="caption" />
    <ng-content select="colgroup, col" />

    <!--
      Unprojected content throws a hydration error so we need this to capture it.
      It gets removed on the client so it doesn't affect the layout.
    -->
    @if (_isServer) {
      <ng-content />
    }

    <thead hlmTHead role="rowgroup">
      <ng-container headerRowOutlet />
    </thead>
    <tbody class="mdc-data-table__content" hlmTBody role="rowgroup">
      <ng-container rowOutlet />
      <ng-container noDataRowOutlet />
    </tbody>
    <tfoot hlmTFoot role="rowgroup">
      <ng-container footerRowOutlet />
    </tfoot>
  `,
  providers: [
    {provide: CdkTable, useExisting: HlmDataTable},
    {provide: CDK_TABLE, useExisting: HlmDataTable},
    {provide: _VIEW_REPEATER_STRATEGY, useClass: _DisposeViewRepeaterStrategy},
    // Prevent nested tables from seeing this table's StickyPositioningListener.
    {provide: STICKY_POSITIONING_LISTENER, useValue: null},
  ],
  hostDirectives: [HlmTable],
  encapsulation: ViewEncapsulation.None,
  // See note on CdkTable for explanation on why this uses the default change detection strategy.
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [
    HeaderRowOutlet,
    DataRowOutlet,
    NoDataRowOutlet,
    FooterRowOutlet,
    HlmTBody,
    HlmTFoot,
    HlmTHead,
  ],
})
export class HlmDataTable<T> extends CdkTable<T> {
  /** Overrides the need to add position: sticky on every sticky cell element in `CdkTable`. */
  protected override needsPositionStickyOnElement = false;
}
