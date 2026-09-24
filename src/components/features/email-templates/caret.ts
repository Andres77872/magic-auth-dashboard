type TextField = HTMLInputElement | HTMLTextAreaElement;

/**
 * Insert `token` at the caret (or over the selection) of `field`, whose current
 * value is `value`. Returns the new value; call `restore` after React commits it
 * to put the caret back after the inserted token.
 */
export function insertAtCaret(
  field: TextField | null,
  value: string,
  token: string
): { next: string; restore: () => void } {
  const start = field?.selectionStart ?? value.length;
  const end = field?.selectionEnd ?? value.length;
  const next = value.slice(0, start) + token + value.slice(end);
  const caret = start + token.length;
  return {
    next,
    restore: () => {
      if (!field) return;
      field.focus();
      field.setSelectionRange(caret, caret);
    },
  };
}
