/** One axis per contact, including its release momentum. Positions are CSS pixels. */
export class CanvasTableGesture {
  axis: 'x' | 'y' | null = null;
  dragging = false;
  left = 0;
  top = 0;
  private x = 0;
  private y = 0;
  private originLeft = 0;
  private originTop = 0;
  private velocity = 0;
  private time = 0;

  start(x: number, y: number, left: number, top: number, now: number) {
    this.axis = null;
    this.dragging = true;
    this.x = x; this.y = y;
    this.left = this.originLeft = left;
    this.top = this.originTop = top;
    this.velocity = 0; this.time = now;
  }

  move(x: number, y: number, now: number, maxLeft: number, maxTop: number) {
    if (!this.dragging) return;
    const dx = x - this.x, dy = y - this.y;
    if (!this.axis) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return;
      this.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    }
    const previous = this.axis === 'x' ? this.left : this.top;
    if (this.axis === 'x') this.left = Math.max(0, Math.min(maxLeft, this.originLeft - dx));
    else this.top = Math.max(0, Math.min(maxTop, this.originTop - dy));
    const next = this.axis === 'x' ? this.left : this.top;
    const elapsed = Math.max(1, now - this.time);
    this.velocity = Math.max(-3, Math.min(3, (next - previous) / elapsed));
    this.time = now;
  }

  release(now: number, cancelled = false) {
    this.dragging = false;
    if (cancelled || now - this.time > 80) this.velocity = 0;
    this.time = now;
  }

  step(now: number, maxLeft: number, maxTop: number) {
    if (this.dragging || !this.axis || Math.abs(this.velocity) < .02) return false;
    const elapsed = Math.max(0, now - this.time);
    const decay = Math.exp(-elapsed / 240);
    const distance = this.velocity * 240 * (1 - decay);
    const previous = this.axis === 'x' ? this.left : this.top;
    const next = Math.max(0, Math.min(this.axis === 'x' ? maxLeft : maxTop, previous + distance));
    if (this.axis === 'x') this.left = next; else this.top = next;
    this.velocity = next === previous ? 0 : this.velocity * decay;
    this.time = now;
    return Math.abs(this.velocity) >= .02;
  }
}

/** Shares the painter's RAF: input events collect positions, never start a second loop. */
export function attachTableGesture(root: HTMLElement, scroller: HTMLElement, schedule: () => void, cancelTap: () => void) {
  const gesture = new CanvasTableGesture();
  let pointer: number | null = null;
  let dirty = false;
  let suppressClick = false;
  const down = (event: PointerEvent) => {
    if (event.pointerType !== 'touch') return;
    if (!event.isPrimary) {
      gesture.release(event.timeStamp, true);
      pointer = null;
      cancelTap();
      return;
    }
    // Top-layer controls retain their own native interactions.
    if ((event.target as Element).closest('dialog, [popover]')) return;
    pointer = event.pointerId;
    suppressClick = false;
    gesture.start(event.clientX, event.clientY, scroller.scrollLeft, scroller.scrollTop, event.timeStamp);
  };
  const move = (event: PointerEvent) => {
    if (event.pointerId !== pointer) return;
    gesture.move(event.clientX, event.clientY, event.timeStamp, scroller.scrollWidth - scroller.clientWidth, scroller.scrollHeight - scroller.clientHeight);
    if (!gesture.axis) return;
    if (!root.hasPointerCapture(event.pointerId)) root.setPointerCapture(event.pointerId);
    suppressClick = true;
    cancelTap();
    dirty = true;
    schedule();
  };
  const end = (event: PointerEvent) => {
    if (event.pointerId !== pointer) return;
    // Moving implicit capture from a touched child to the root is not cancellation.
    if (event.type === 'lostpointercapture' && event.target !== root) return;
    gesture.release(event.timeStamp, event.type !== 'pointerup');
    pointer = null;
    schedule();
  };
  const click = (event: MouseEvent) => {
    if (!suppressClick || event.detail === 0) return;
    event.preventDefault(); event.stopPropagation();
    suppressClick = false;
  };
  const interrupt = () => gesture.release(performance.now(), true);
  root.addEventListener('pointerdown', down, true);
  root.addEventListener('pointermove', move, true);
  root.addEventListener('pointerup', end, true);
  root.addEventListener('pointercancel', end, true);
  root.addEventListener('lostpointercapture', end, true);
  root.addEventListener('click', click, true);
  root.addEventListener('wheel', interrupt, { passive: true });
  root.addEventListener('keydown', interrupt);
  return {
    update(now: number) {
      const left = gesture.left, top = gesture.top;
      const running = gesture.step(now, scroller.scrollWidth - scroller.clientWidth, scroller.scrollHeight - scroller.clientHeight);
      if (dirty || left !== gesture.left || top !== gesture.top) {
        if (gesture.axis === 'x') scroller.scrollLeft = gesture.left;
        if (gesture.axis === 'y') scroller.scrollTop = gesture.top;
        dirty = false;
      }
      return running;
    },
    dispose() {
      root.removeEventListener('pointerdown', down, true);
      root.removeEventListener('pointermove', move, true);
      root.removeEventListener('pointerup', end, true);
      root.removeEventListener('pointercancel', end, true);
      root.removeEventListener('lostpointercapture', end, true);
      root.removeEventListener('click', click, true);
      root.removeEventListener('wheel', interrupt);
      root.removeEventListener('keydown', interrupt);
      if (pointer !== null && root.hasPointerCapture(pointer)) root.releasePointerCapture(pointer);
    },
  };
}
