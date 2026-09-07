// Small, capability-detected fallbacks for APIs used by this offline build.
const define = (target: object, key: string, value: unknown) => {
  if (!(key in target)) Object.defineProperty(target, key, { configurable: true, writable: true, value });
};
define(window, 'globalThis', window);
define(Object, 'fromEntries', (entries: Iterable<[PropertyKey, unknown]>) => {
  const result = {}; for (const [key, value] of entries) Object.defineProperty(result, key, { value, enumerable: true, configurable: true, writable: true }); return result;
});
define(Array.prototype, 'at', function(this: unknown[], index: number) { const i = Math.trunc(index) || 0; return this[i < 0 ? this.length + i : i]; });
define(Array.prototype, 'flatMap', function(this: unknown[], fn: (value: unknown, index: number, array: unknown[]) => unknown, context?: unknown) { return this.reduce<unknown[]>((result, value, index, array) => result.concat(fn.call(context, value, index, array)), []); });
define(String.prototype, 'replaceAll', function(this: string, search: string, value: string) { return String(this).split(search).join(value); });
define(Promise.prototype, 'finally', function(this: Promise<unknown>, fn: () => unknown) { return this.then(value => Promise.resolve(fn()).then(() => value), error => Promise.resolve(fn()).then(() => { throw error; })); });
if (!window.matchMedia('(min-width:0px)').addEventListener) {
  const native = window.matchMedia.bind(window);
  window.matchMedia = query => { const media = native(query); media.addEventListener = (_type: string, listener: EventListenerOrEventListenerObject | null) => media.addListener(listener as (event: MediaQueryListEvent) => void); media.removeEventListener = (_type: string, listener: EventListenerOrEventListenerObject | null) => media.removeListener(listener as (event: MediaQueryListEvent) => void); return media; };
}
if (!('ResizeObserver' in window)) {
  class LocalResizeObserver {
    private timer?: ReturnType<typeof setInterval>;
    private sizes = new Map<Element, string>();
    constructor(private callback: () => void) {}
    observe(element: Element) { this.sizes.set(element, ''); if (!this.timer) this.timer = setInterval(() => { let changed = false; this.sizes.forEach((size, el) => { const next = `${el.clientWidth}:${el.clientHeight}`; if (next !== size) { this.sizes.set(el, next); changed = true; } }); if (changed) this.callback(); }, 160); }
    unobserve(element: Element) { this.sizes.delete(element); if (!this.sizes.size) this.disconnect(); }
    disconnect() { clearInterval(this.timer); this.timer = undefined; this.sizes.clear(); }
  }
  Object.defineProperty(window, 'ResizeObserver', { value: LocalResizeObserver });
}
define(CanvasRenderingContext2D.prototype, 'roundRect', function(this: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radius: number) {
  const r = Math.min(radius, w / 2, h / 2); this.moveTo(x+r,y); this.arcTo(x+w,y,x+w,y+h,r); this.arcTo(x+w,y+h,x,y+h,r); this.arcTo(x,y+h,x,y,r); this.arcTo(x,y,x+w,y,r); this.closePath();
});
const flex = document.createElement('div');
flex.style.cssText = 'position:absolute;visibility:hidden;display:flex;flex-direction:column;row-gap:1px';
flex.appendChild(document.createElement('div')); flex.appendChild(document.createElement('div')); document.body.appendChild(flex);
if (flex.scrollHeight !== 1) document.documentElement.classList.add('no-flex-gap');
flex.remove();
const viewport = () => document.documentElement.style.setProperty('--app-height', `${window.visualViewport?.height ?? window.innerHeight}px`);
viewport(); window.addEventListener('resize', viewport); window.visualViewport?.addEventListener('resize', viewport);
try { const theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; document.documentElement.dataset.theme = theme; document.documentElement.style.colorScheme = theme; } catch { /* Use light baseline. */ }

define(Array.prototype, 'flat', function(this: unknown[], depth = 1): unknown[] {
  return this.reduce<unknown[]>((result, value) => result.concat(Array.isArray(value) && depth > 0 ? value.flat(depth - 1) : [value]), []);
});
if (!('AbortController' in window)) {
  class LocalAbortController {
    signal = Object.assign(document.createDocumentFragment(), { aborted: false });
    abort() { if (!this.signal.aborted) { this.signal.aborted = true; this.signal.dispatchEvent(new Event('abort')); } }
  }
  Object.defineProperty(window, 'AbortController', { value: LocalAbortController });
}
if (!Element.prototype.getAnimations) {
  define(Element.prototype, 'getAnimations', () => []);
  document.documentElement.classList.add('xhs-simple-motion');
}
