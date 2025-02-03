export function setCaretPosition(el: HTMLInputElement, pos: number) {
  el.focus();
  el.setSelectionRange(pos, pos);
}

export function getCaretPosition(el: HTMLInputElement) {
  const val = el.value;
  return val.slice(0, el.selectionStart ?? 0).length;
}
