/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import {ChangeDetectionStrategy, Component, ViewEncapsulation} from '@angular/core';

import {CdkTextColumn} from '@angular/cdk/table';

import {MatCell, MatCellDef, MatColumnDef, MatHeaderCell, MatHeaderCellDef} from './cell';

/**
 * Column that simply shows text content for the header and row cells. Assumes that the table
 * is using the native table implementation (`<table>`).
 *
 * By default, the name of this column will be the header text and data property accessor.
 * The header text can be overridden with the `headerText` input. Cell values can be overridden with
 * the `dataAccessor` input. Change the text justification to the start or end using the `justify`
 * input.
 */
@Component({
  selector: 'mat-text-column',
  template: `
    <ng-container matColumnDef>
      <th *matHeaderCellDef [style.text-align]="justify" mat-header-cell>
        {{ headerText }}
      </th>
      <td *matCellDef="let data" [style.text-align]="justify" mat-cell>
        {{ dataAccessor(data, name) }}
      </td>
    </ng-container>
  `,
  encapsulation: ViewEncapsulation.None,
  // Change detection is intentionally not set to OnPush. This component's template will be provided
  // to the table to be inserted into its view. This is problematic when change detection runs since
  // the bindings in this template will be evaluated _after_ the table's view is evaluated, which
  // mean's the template in the table's view will not have the updated value (and in fact will cause
  // an ExpressionChangedAfterItHasBeenCheckedError).
  // tslint:disable-next-line:validate-decorators
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell],
})
export class MatTextColumn<T> extends CdkTextColumn<T> {}
