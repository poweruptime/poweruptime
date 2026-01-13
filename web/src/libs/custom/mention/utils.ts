// libs/shared/ui/mentions/src/lib/utils.ts

/**
 * Gets the current caret position in an input or textarea element
 */
export function getCaretPosition(element: HTMLInputElement | HTMLTextAreaElement): number {
  return element.selectionStart ?? 0;
}

/**
 * Sets the caret position in an input or textarea element
 */
export function setCaretPosition(
  element: HTMLInputElement | HTMLTextAreaElement,
  position: number,
): void {
  element.setSelectionRange(position, position);
  element.focus();
}
