// jsdom has no ResizeObserver; Radix checkboxes measure themselves with it.
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

if (!('ResizeObserver' in globalThis)) {
  Object.defineProperty(globalThis, 'ResizeObserver', {
    value: ResizeObserverStub,
    writable: true,
  });
}
