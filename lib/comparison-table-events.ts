/** Shared between the chat and the viewport, without coupling to DOM cell nodes. */
export const focusRecorderEvent = 'recorder-select:focus-recorder';
export function focusRecorderColumn(recorderId: string) {
  window.dispatchEvent(new CustomEvent(focusRecorderEvent, { detail: recorderId }));
}
