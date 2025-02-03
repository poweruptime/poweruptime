import {addAriaReferencedId, removeAriaReferencedId} from '@angular/cdk/a11y';
import {Directionality} from '@angular/cdk/bidi';
import {DOWN_ARROW, ENTER, ESCAPE, TAB, UP_ARROW, hasModifierKey} from '@angular/cdk/keycodes';
import {
  ConnectedPosition,
  FlexibleConnectedPositionStrategy,
  Overlay,
  OverlayConfig,
  OverlayRef,
  PositionStrategy,
} from '@angular/cdk/overlay';
import {_getEventTarget} from '@angular/cdk/platform';
import {TemplatePortal} from '@angular/cdk/portal';
import {DOCUMENT} from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Directive,
  ElementRef,
  EnvironmentInjector,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Renderer2,
  SimpleChanges,
  ViewContainerRef,
  afterNextRender,
  forwardRef,
  inject,
  model,
} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {
  MAT_AUTOCOMPLETE_DEFAULT_OPTIONS,
  MatAutocomplete,
  MatAutocompleteDefaultOptions,
  MatAutocompleteOrigin,
} from '@angular/material/autocomplete';
import {
  MatOption,
  MatOptionSelectionChange,
  _getOptionScrollPosition,
} from '@angular/material/core';
import {MAT_FORM_FIELD, MatFormField} from '@angular/material/form-field';

import {
  EMPTY,
  Observable,
  Subject,
  Subscription,
  defer,
  delay,
  filter,
  map,
  merge,
  startWith,
  switchMap,
  take,
  tap,
} from 'rxjs';

import {getCaretPosition, setCaretPosition} from './utils';

// your caret utilities

/**
 * Provider that allows the autocomplete to register as a ControlValueAccessor.
 * @docs-private
 */
export const MAT_MENTIONS_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => MentionAutocompleteTrigger),
  multi: true,
};

/**
 * Error thrown when attempting to use an autocomplete trigger without a panel.
 * @docs-private
 */
export function getMatMentionsMissingPanelError(): Error {
  return Error(
    'Attempting to open an undefined instance of `mat-autocomplete`. ' +
      'Make sure that the id passed to the `matMentions` is correct and that ' +
      "you're attempting to open it after the ngAfterContentInit hook.",
  );
}

@Directive({
  selector: `input[matMentions], textarea[matMentions]`,
  host: {
    class: 'mat-mdc-autocomplete-trigger',
    '[attr.autocomplete]': 'autocompleteAttribute',
    '[attr.role]': 'autocompleteDisabled ? null : "combobox"',
    '[attr.aria-autocomplete]': 'autocompleteDisabled ? null : "list"',
    '[attr.aria-activedescendant]': '(panelOpen && activeOption) ? activeOption.id : null',
    '[attr.aria-expanded]': 'autocompleteDisabled ? null : panelOpen.toString()',
    '[attr.aria-controls]': '(autocompleteDisabled || !panelOpen) ? null : autocomplete?.id',
    '[attr.aria-haspopup]': 'autocompleteDisabled ? null : "listbox"',
    '(blur)': '_onTouched()',
    '(input)': '_handleInput($event)',
    '(keydown)': '_handleKeydown($event)',
  },
  exportAs: 'matMentionTrigger',
  providers: [MAT_MENTIONS_VALUE_ACCESSOR],
})
export class MentionAutocompleteTrigger
  implements ControlValueAccessor, AfterViewInit, OnChanges, OnDestroy
{
  private _environmentInjector = inject(EnvironmentInjector);
  private _element = inject<ElementRef<HTMLInputElement>>(ElementRef);
  private _overlay = inject(Overlay);
  private _viewContainerRef = inject(ViewContainerRef);
  private _zone = inject(NgZone);
  private _changeDetectorRef = inject(ChangeDetectorRef);
  private _dir = inject(Directionality, {optional: true});
  private _formField = inject<MatFormField | null>(MAT_FORM_FIELD, {optional: true, host: true});
  private _document = inject(DOCUMENT);
  private _renderer = inject(Renderer2);
  private _defaults = inject<MatAutocompleteDefaultOptions | null>(
    MAT_AUTOCOMPLETE_DEFAULT_OPTIONS,
    {optional: true},
  );

  /** Overlay References */
  private _overlayRef?: OverlayRef;
  private _portal?: TemplatePortal;
  private _positionStrategy?: FlexibleConnectedPositionStrategy;
  private _closingActionsSubscription: Subscription = Subscription.EMPTY;
  private _keydownSubscription: Subscription | null = null;
  private _outsideClickSubscription: Subscription | null = null;

  /** Lifecycle */
  private _componentDestroyed = false;
  private _initialized = new Subject<void>();

  /** Value & State Tracking */
  private _previousValue?: string | number;
  private _valueOnAttach?: string | number;
  private _valueOnLastKeydown?: string;
  private _overlayAttached: boolean = false;
  private _manuallyFloatingLabel = false;
  private _trackedModal: Element | null = null;
  private _cleanupWindowBlur?: () => void;

  /** Whether the autocomplete is disabled. */
  @Input('matAutocompleteDisabled')
  autocompleteDisabled: boolean = false;

  /** The autocomplete panel to be attached to this trigger. */
  @Input('matMentions') autocomplete!: MatAutocomplete;

  /** Position of the autocomplete panel relative to the trigger element. */
  @Input('matAutocompletePosition') position: 'auto' | 'above' | 'below' = 'auto';

  /**
   * Reference relative to which to position the autocomplete panel.
   * Defaults to the trigger’s own element.
   */
  @Input('matAutocompleteConnectedTo') connectedTo?: MatAutocompleteOrigin;

  /**
   * `autocomplete` attribute to apply on the underlying input (e.g. "off").
   */
  @Input() autocompleteAttribute: string = 'off';

  /**
   * Single mention trigger character; defaults to `@`.
   * When typed, we’ll start showing the autocomplete panel if possible.
   */
  @Input() mentionTriggerChar: string = '@';

  mentionFilter = model<string>('');

  /** Tracks whether we are currently "in" a mention. */
  private _mentionActive = false;
  /** Position in text where user typed the trigger char. */
  private _mentionStartPos: number = -1;

  constructor() {
    // all injections are handled above
  }

  // -----------------------------
  // Angular lifecycle
  // -----------------------------

  ngAfterViewInit() {
    this._initialized.next();
    this._initialized.complete();

    // Listen for window blur so we don’t automatically re-open the panel if focus
    // is lost and regained (IE/Edge specific fix).
    this._cleanupWindowBlur = this._renderer.listen('window', 'blur', () => {});
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['position'] && this._positionStrategy) {
      this._setStrategyPositions(this._positionStrategy);
      if (this.panelOpen) {
        this._overlayRef!.updatePosition();
      }
    }
  }

  ngOnDestroy() {
    this._cleanupWindowBlur?.();
    this._componentDestroyed = true;
    this.closePanel();
    this._clearFromModal();
    this._initialized.complete();
  }

  // -----------------------------
  // ControlValueAccessor
  // -----------------------------

  private _onChange: (value: any) => void = () => {};

  writeValue(value: any): void {
    // Defer writing in case we’re in the middle of initialization.
    Promise.resolve().then(() => {
      const display = this._getDisplayValue(value);
      this._updateNativeInputValue(display != null ? display : '');
    });
  }

  registerOnChange(fn: (value: any) => {}): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => {}): void {
    this._onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this._element.nativeElement.disabled = isDisabled;
  }

  // -----------------------------
  // Host listeners for key/input
  // -----------------------------

  /**
   * Keydown: we watch for the mention trigger char, arrow keys, or ESC, etc.
   */
  _handleKeydown(event: KeyboardEvent): void {
    const keyCode = event.keyCode;
    const wasPanelOpen = this.panelOpen;

    // Standard MatAutocompleteTrigger: prevent default on ESC to avoid input-value revert on IE.
    if (keyCode === ESCAPE && !hasModifierKey(event)) {
      event.preventDefault();
    }

    // Keep track of the input’s value at the time of keydown.
    this._valueOnLastKeydown = this._element.nativeElement.value;

    // If the user has an active item and hits ENTER, select that item.
    if (this.activeOption && keyCode === ENTER && this.panelOpen && !hasModifierKey(event)) {
      this.activeOption._selectViaInteraction();
      this._resetActiveItem();
      event.preventDefault();
      return;
    }

    // Move the autocomplete's key manager for arrow or tab.
    if (this.autocomplete) {
      const prevActive = this.autocomplete._keyManager.activeItem;
      const isArrowKey = keyCode === UP_ARROW || keyCode === DOWN_ARROW;

      if ((keyCode === TAB || isArrowKey) && this.panelOpen) {
        this.autocomplete._keyManager.onKeydown(event);
      } else if (isArrowKey && this._mentionActive) {
        this._openPanelInternal(this._valueOnLastKeydown);
      }

      if (isArrowKey || this.autocomplete._keyManager.activeItem !== prevActive) {
        // Scroll to new active option if we’re in the panel.
        this._scrollToOption(this.autocomplete._keyManager.activeItemIndex ?? 0);
      }
    }

    // ---- Mention logic:
    // 1) Check if user just typed the mention trigger char.
    if (!this._mentionActive && event.key === this.mentionTriggerChar) {
      // Enter "mention mode."
      this._mentionActive = true;
      this._mentionStartPos = getCaretPosition(this._element.nativeElement);

      // Force panel to open if not already.
      if (!wasPanelOpen) {
        this._openPanelInternal();
      }
      return;
    }

    // 2) If we’re in mention mode, watch for ESC, space, etc. to close mention.
    if (this._mentionActive) {
      // Pressing ESC leaves mention mode.
      if (keyCode === ESCAPE) {
        event.preventDefault();
        this._mentionActive = false;
        this.closePanel();
        return;
      }
      // Pressing SPACE might finalize or break out of mention mode, etc.
      if (keyCode === 32 /* space */) {
        this._mentionActive = false;
        this.closePanel();
      }
    }
  }

  /**
   * Input: we check for changes in the typed text, handle normal form updates,
   * and if we’re in mention mode, we update mention text or exit mention mode if user backspaced.
   */
  _handleInput(event: KeyboardEvent): void {
    const inputEl = event.target as HTMLInputElement;
    let currentValue: string | number | undefined = inputEl.value;

    // If it's type=number, parse it as a float or undefined.
    if (inputEl.type === 'number') {
      currentValue = currentValue === '' ? undefined : parseFloat(currentValue);
    }

    // Only proceed if the value actually changed.
    if (this._previousValue !== currentValue) {
      this._previousValue = currentValue;
      this._onChange(currentValue);

      // If in mention mode, see if user has backspaced before the trigger char.
      if (this._mentionActive && this._mentionStartPos >= 0) {
        const caretPos = getCaretPosition(this._element.nativeElement);
        if (caretPos <= this._mentionStartPos) {
          // They backspaced past the trigger => exit mention mode, close panel.
          this._mentionActive = false;
          this.closePanel();
        } else {
          // The user is typing after the trigger char, so you can do filtering logic here.
          const mentionText = inputEl.value.substring(this._mentionStartPos + 1, caretPos);
          this.mentionFilter.set(mentionText);
        }
      }
    }
  }

  /** Blur handler to mark as touched. */
  _onTouched() {}

  // -----------------------------
  // Public API for opening/closing panel
  // -----------------------------

  /** Whether the autocomplete panel is currently open. */
  get panelOpen(): boolean {
    return this._overlayAttached && this.autocomplete?.showPanel;
  }

  /** Opens the autocomplete suggestion panel (if allowed). */
  openPanel(): void {
    if (!this._canOpen()) {
      return;
    }
    this._openPanelInternal(this._element.nativeElement.value);
  }

  /** Closes the autocomplete suggestion panel. */
  closePanel(): void {
    this._resetLabel();
    if (!this._overlayAttached) {
      return;
    }

    if (this.panelOpen) {
      this._zone.run(() => {
        this.autocomplete.closed.emit();
      });
    }

    if (this.autocomplete?._latestOpeningTrigger === this) {
      this.autocomplete._isOpen = false;
      this.autocomplete._latestOpeningTrigger = null;
    }

    this._overlayAttached = false;
    if (this._overlayRef?.hasAttached()) {
      this._overlayRef.detach();
      this._closingActionsSubscription.unsubscribe();
    }
    this._updatePanelState();

    if (!this._componentDestroyed) {
      this._changeDetectorRef.detectChanges();
    }

    // Remove aria-owns from the tracked modal, if any.
    if (this._trackedModal) {
      removeAriaReferencedId(this._trackedModal, 'aria-owns', this.autocomplete.id);
    }

    this._overlayRef?.dispose();
    this._overlayRef = undefined;
  }

  /** Reposition the panel overlay if it’s open. */
  updatePosition(): void {
    if (this._overlayAttached) {
      this._overlayRef!.updatePosition();
    }
  }

  // -----------------------------
  // Internal core logic
  // -----------------------------

  /** The currently active option in the autocomplete. */
  get activeOption(): MatOption | null {
    return this.autocomplete?._keyManager.activeItem ?? null;
  }

  /** Stream of option selection events. */
  readonly optionSelections: Observable<MatOptionSelectionChange> = defer(() => {
    const options = this.autocomplete?.options;
    if (options) {
      return options.changes.pipe(
        startWith(options),
        switchMap(() => merge(...options.map((opt) => opt.onSelectionChange))),
      );
    }
    return this._initialized.pipe(switchMap(() => this.optionSelections));
  }) as Observable<MatOptionSelectionChange>;

  /**
   * Stream of actions that should close the autocomplete panel:
   * - Option selected
   * - Tab out
   * - ESC from the panel
   * - Outside clicks
   * - Overlay detach
   */
  get panelClosingActions(): Observable<MatOptionSelectionChange | null> {
    return merge(
      this.optionSelections,
      this.autocomplete._keyManager.tabOut.pipe(filter(() => this._overlayAttached)),
      this._closeKeyEventStream,
      this._getOutsideClickStream(),
      this._overlayRef
        ? this._overlayRef.detachments().pipe(filter(() => this._overlayAttached))
        : EMPTY,
    ).pipe(map((event) => (event instanceof MatOptionSelectionChange ? event : null)));
  }

  private _closeKeyEventStream = new Subject<void>();

  /**
   * Opens the overlay, attaches the autocomplete’s template portal, and sets up the position.
   */
  private _openPanelInternal(valueOnAttach = this._element.nativeElement.value) {
    this._attachOverlay(valueOnAttach);
    this._floatLabel();
    if (this._trackedModal) {
      addAriaReferencedId(this._trackedModal, 'aria-owns', this.autocomplete.id);
    }
  }

  private _attachOverlay(valueOnAttach: string) {
    if (!this.autocomplete) {
      throw getMatMentionsMissingPanelError();
    }

    let overlayRef = this._overlayRef;

    if (!overlayRef) {
      // Create the overlay
      this._portal = new TemplatePortal(this.autocomplete.template, this._viewContainerRef, {
        id: this._formField?._labelId,
      });
      overlayRef = this._overlay.create(this._getOverlayConfig());
      this._overlayRef = overlayRef;

      // Subscribe to panel closing
      this._closingActionsSubscription = this._subscribeToClosingActions();
    } else {
      // Update position strategy & size if overlay already exists
      this._positionStrategy?.setOrigin(this._getConnectedElement());
      overlayRef.updateSize({width: this._getPanelWidth()});
    }

    // Attach the portal if not already attached.
    if (!overlayRef.hasAttached()) {
      overlayRef.attach(this._portal);

      // picking the same item again will always emit a selection event.
      this.autocomplete.options.forEach((option) => option.deselect());

      this._valueOnAttach = valueOnAttach;
      this._valueOnLastKeydown = undefined;
    }

    const wasOpen = this.panelOpen;
    this.autocomplete._isOpen = this._overlayAttached = true;
    this.autocomplete._latestOpeningTrigger = this;
    this.autocomplete._setColor(this._formField?.color);
    this._updatePanelState();
    this._applyModalPanelOwnership();

    if (this.panelOpen && !wasOpen) {
      this.autocomplete.opened.emit();
    }
  }

  private _subscribeToClosingActions(): Subscription {
    // Fire once after the initial render of the panel.
    const initialRender = new Observable((subscriber) => {
      afterNextRender(() => subscriber.next(), {injector: this._environmentInjector});
    });

    // Watch for changes to the options (new options after async load, etc.).
    const optionChanges = this.autocomplete.options.changes.pipe(
      tap(() => this._positionStrategy?.reapplyLastPosition()),
      delay(0),
    );

    // Merge those triggers; once triggered, take(1) => close
    return merge(initialRender, optionChanges)
      .pipe(
        switchMap(() =>
          this._zone.run(() => {
            const wasOpen = this.panelOpen;
            this._resetActiveItem();
            this._updatePanelState();
            this._changeDetectorRef.detectChanges();

            if (this.panelOpen) {
              this._overlayRef?.updatePosition();
            }
            if (wasOpen !== this.panelOpen && this.panelOpen) {
              this.autocomplete.opened.emit();
            } else if (wasOpen && !this.panelOpen) {
              this.autocomplete.closed.emit();
            }
            return this.panelClosingActions;
          }),
        ),
        take(1),
      )
      .subscribe((event) => this._setValueAndClose(event));
  }

  /** Configuration for the overlay (position, scrolling, etc.) */
  private _getOverlayConfig(): OverlayConfig {
    return new OverlayConfig({
      positionStrategy: this._getOverlayPosition(),
      scrollStrategy: this._overlay.scrollStrategies.reposition(),
      width: this._getPanelWidth(),
      direction: this._dir ?? undefined,
      panelClass: this._defaults?.overlayPanelClass,
    });
  }

  private _getOverlayPosition(): PositionStrategy {
    const strategy = this._overlay
      .position()
      .flexibleConnectedTo(this._getConnectedElement())
      .withFlexibleDimensions(false)
      .withPush(false);

    this._setStrategyPositions(strategy);
    this._positionStrategy = strategy;
    return strategy;
  }

  private _setStrategyPositions(positionStrategy: FlexibleConnectedPositionStrategy) {
    const belowPositions: ConnectedPosition[] = [
      {originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top'},
      {originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top'},
    ];
    const abovePositions: ConnectedPosition[] = [
      {
        originX: 'start',
        originY: 'top',
        overlayX: 'start',
        overlayY: 'bottom',
        panelClass: 'mat-mdc-autocomplete-panel-above',
      },
      {
        originX: 'end',
        originY: 'top',
        overlayX: 'end',
        overlayY: 'bottom',
        panelClass: 'mat-mdc-autocomplete-panel-above',
      },
    ];

    let positions: ConnectedPosition[];
    if (this.position === 'above') {
      positions = abovePositions;
    } else if (this.position === 'below') {
      positions = belowPositions;
    } else {
      positions = [...belowPositions, ...abovePositions];
    }
    positionStrategy.withPositions(positions);
  }

  private _getPanelWidth(): number | string {
    return this.autocomplete.panelWidth || this._getHostWidth();
  }

  private _getHostWidth(): number {
    return this._getConnectedElement().nativeElement.getBoundingClientRect().width;
  }

  private _getConnectedElement(): ElementRef<HTMLElement> {
    return this.connectedTo
      ? this.connectedTo.elementRef
      : this._formField
        ? this._formField.getConnectedOverlayOrigin()
        : this._element;
  }

  /**
   * Called once an option is selected or panel is otherwise closed.
   * Inserts the mention text if we’re in mention mode, or sets the control to the selected value.
   */
  private _setValueAndClose(event: MatOptionSelectionChange | null): void {
    const toSelect = event?.source;

    if (toSelect) {
      // If mention is active, insert the mention into the text.
      if (this._mentionActive && this._mentionStartPos >= 0) {
        const mentionValue = toSelect.value;
        const inputVal = this._element.nativeElement.value;
        const caretPos = getCaretPosition(this._element.nativeElement);
        const before = inputVal.slice(0, this._mentionStartPos);
        const after = inputVal.slice(caretPos);

        // For example, we might insert "@someValue "
        const newVal = before + this.mentionTriggerChar + mentionValue + ' ' + after;

        this._updateNativeInputValue(newVal);
        // Move the caret right after the mention text
        const newPos = before.length + 1 + mentionValue.length + 1;
        setCaretPosition(this._element.nativeElement, newPos);

        this._onChange(newVal);
      } else {
        // If not a mention, treat it as a standard autocomplete selection
        const displayValue = this._getDisplayValue(toSelect.value);
        this._updateNativeInputValue(displayValue);
        this._onChange(toSelect.value);
      }

      // Emit the selection from the autocomplete itself
      this.autocomplete._emitSelectEvent(toSelect);

      // Reset mention mode
      this._mentionActive = false;
    } else if (
      this.autocomplete.requireSelection &&
      this._element.nativeElement.value !== this._valueOnAttach
    ) {
      // If requireSelection is true, revert to blank if user typed something else.
      this._updateNativeInputValue('');
      this._onChange(null);
    }

    // Finally close the panel.
    this.closePanel();
  }

  /** Writes directly into the underlying input or form field control. */
  private _updateNativeInputValue(value: string): void {
    if (this._formField) {
      (this._formField._control as any).value = value;
    } else {
      this._element.nativeElement.value = value;
    }
    this._previousValue = value;
  }

  /** If a displayWith function is set, returns that for the given value. */
  private _getDisplayValue<T>(value: T): string | T {
    return this.autocomplete?.displayWith ? this.autocomplete.displayWith(value) : value;
  }

  /** Reset the active item to -1 or the first enabled option if autoActiveFirstOption is on. */
  private _resetActiveItem(): void {
    if (this.autocomplete.autoActiveFirstOption) {
      let firstEnabledIndex = -1;
      for (let i = 0; i < this.autocomplete.options.length; i++) {
        if (!this.autocomplete.options.get(i)!.disabled) {
          firstEnabledIndex = i;
          break;
        }
      }
      this.autocomplete._keyManager.setActiveItem(firstEnabledIndex);
    } else {
      this.autocomplete._keyManager.setActiveItem(-1);
    }
  }

  /** Scroll to the currently active option, so it remains visible. */
  private _scrollToOption(index: number): void {
    if (this.autocomplete.panel) {
      const option = this.autocomplete.options.toArray()[index];
      if (!option) {
        return;
      }
      const el = option._getHostElement();
      const newScroll = _getOptionScrollPosition(
        el.offsetTop,
        el.offsetHeight,
        this.autocomplete._getScrollTop(),
        this.autocomplete.panel.nativeElement.offsetHeight,
      );
      this.autocomplete._setScrollTop(newScroll);
    }
  }

  /** Force the form field’s floating label. */
  private _floatLabel(shouldAnimate = false): void {
    if (this._formField && this._formField.floatLabel === 'auto') {
      if (shouldAnimate) {
        this._formField._animateAndLockLabel();
      } else {
        this._formField.floatLabel = 'always';
      }
      this._manuallyFloatingLabel = true;
    }
  }

  /** Reset the floating label if we manually elevated it. */
  private _resetLabel(): void {
    if (this._manuallyFloatingLabel && this._formField) {
      this._formField.floatLabel = 'auto';
      this._manuallyFloatingLabel = false;
    }
  }

  /** Whether the trigger is allowed to open the panel (input not disabled, etc.). */
  private _canOpen(): boolean {
    const el = this._element.nativeElement;
    return !el.readOnly && !el.disabled && !this.autocompleteDisabled;
  }

  /** Syncs up the panel’s internal state (e.g. visibility, keydown subscriptions). */
  private _updatePanelState() {
    if (!this._overlayRef) {
      return;
    }
    this.autocomplete._setVisibility();

    if (this.panelOpen) {
      // Listen for keydown events inside the overlay to handle ESC, etc.
      if (!this._keydownSubscription) {
        this._keydownSubscription = this._overlayRef
          .keydownEvents()
          .subscribe((e) => this._handlePanelKeydown(e));
      }
      // Also subscribe to outside pointer events (so we don’t close other overlays).
      if (!this._outsideClickSubscription) {
        this._outsideClickSubscription = this._overlayRef.outsidePointerEvents().subscribe();
      }
    } else {
      this._keydownSubscription?.unsubscribe();
      this._outsideClickSubscription?.unsubscribe();
      this._keydownSubscription = this._outsideClickSubscription = null;
    }
  }

  /** Handle keydown events while the panel is open (e.g. ESC in the panel). */
  private _handlePanelKeydown(event: KeyboardEvent) {
    if (
      (event.keyCode === ESCAPE && !hasModifierKey(event)) ||
      (event.keyCode === UP_ARROW && hasModifierKey(event, 'altKey'))
    ) {
      event.stopPropagation();
      event.preventDefault();
      this._closeKeyEventStream.next();
      this._resetActiveItem();
    }
  }

  /**
   * If the autocomplete trigger is inside an `aria-modal` element,
   * connect that modal to the options panel with `aria-owns`.
   */
  private _applyModalPanelOwnership() {
    const modal = this._element.nativeElement.closest(
      'body > .cdk-overlay-container [aria-modal="true"]',
    );
    if (!modal) {
      return;
    }

    const panelId = this.autocomplete.id;
    if (this._trackedModal) {
      removeAriaReferencedId(this._trackedModal, 'aria-owns', panelId);
    }
    addAriaReferencedId(modal, 'aria-owns', panelId);
    this._trackedModal = modal;
  }

  /** Clears references to the overlay from the modal (if we had set aria-owns). */
  private _clearFromModal() {
    if (this._trackedModal) {
      removeAriaReferencedId(this._trackedModal, 'aria-owns', this.autocomplete.id);
      this._trackedModal = null;
    }
  }

  /** Captures outside clicks on the document to close the panel if they come from elsewhere. */
  private _getOutsideClickStream(): Observable<MouseEvent | TouchEvent> {
    return new Observable((observer) => {
      const listener = (e: MouseEvent | TouchEvent) => {
        const clickTarget = _getEventTarget<HTMLElement>(e)!;
        const formFieldEl = this._formField
          ? this._formField.getConnectedOverlayOrigin().nativeElement
          : null;
        const customOrigin = this.connectedTo?.elementRef.nativeElement;

        if (
          this._overlayAttached &&
          clickTarget !== this._element.nativeElement &&
          this._document.activeElement !== this._element.nativeElement &&
          (!formFieldEl || !formFieldEl.contains(clickTarget)) &&
          (!customOrigin || !customOrigin.contains(clickTarget)) &&
          this._overlayRef &&
          !this._overlayRef.overlayElement.contains(clickTarget)
        ) {
          observer.next(e);
        }
      };

      const disposeClick = this._renderer.listen('document', 'click', listener);
      const disposeAux = this._renderer.listen('document', 'auxclick', listener);
      const disposeTouch = this._renderer.listen('document', 'touchend', listener);

      return () => {
        disposeClick();
        disposeAux();
        disposeTouch();
      };
    });
  }
}
