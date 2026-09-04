/** Composite actual blurred pixels instead of relying on masked backdrop-filter layers. */
export class CanvasScrollEdge {
  private source = document.createElement('canvas');
  private layer = document.createElement('canvas');

  draw(target: HTMLCanvasElement, canvas: HTMLCanvasElement, width: number, height: number, dpr: number, opacity: number, excluded: readonly (readonly [number, number])[]) {
    // Blur is low-frequency: rasterize it at 1x, independently of the crisp table.
    // At DPR 3 this removes 8/9 of the pixels from all three filter passes.
    const sourceDpr = dpr;
    dpr = Math.min(dpr, 1);
    const edgeWidth = Math.max(1, Math.round(width * dpr));
    const edgeHeight = Math.max(1, Math.round(height * dpr));
    const padding = Math.ceil(30 * dpr);
    const tileWidth = edgeWidth + padding * 2;
    const tileHeight = edgeHeight + padding * 2;
    for (const tile of [this.source, this.layer]) {
      if (tile.width !== tileWidth) tile.width = tileWidth;
      if (tile.height !== tileHeight) tile.height = tileHeight;
    }
    if (target.width !== edgeWidth) target.width = edgeWidth;
    if (target.height !== edgeHeight) target.height = edgeHeight;
    const source = this.source.getContext('2d')!;
    const layer = this.layer.getContext('2d')!;
    const output = target.getContext('2d')!;
    output.clearRect(0, 0, edgeWidth, edgeHeight);
    if (opacity <= 0) return;
    source.clearRect(0, 0, tileWidth, tileHeight);
    const cropWidth = Math.min(canvas.width, Math.round((width + 30) * sourceDpr));
    const sourceX = canvas.width - cropWidth;
    const destinationWidth = cropWidth / sourceDpr * dpr;
    const destinationX = edgeWidth + padding - destinationWidth;
    source.drawImage(canvas, sourceX, 0, cropWidth, canvas.height, destinationX, padding, destinationWidth, edgeHeight);
    // Extend the outermost pixels so the blur never samples transparent black outside the viewport.
    source.drawImage(canvas, canvas.width - 1, 0, 1, canvas.height, edgeWidth + padding, padding, padding, edgeHeight);
    source.drawImage(this.source, 0, padding, tileWidth, 1, 0, 0, tileWidth, padding);
    source.drawImage(this.source, 0, padding + edgeHeight - 1, tileWidth, 1, 0, padding + edgeHeight, tileWidth, padding);
    output.globalAlpha = opacity;
    for (const [radius, start] of [[2, 0], [5, .25], [10, .5]]) {
      layer.clearRect(0, 0, tileWidth, tileHeight);
      layer.filter = `blur(${radius * dpr}px)`;
      layer.drawImage(this.source, 0, 0);
      layer.filter = 'none';
      const ramp = layer.createLinearGradient(padding, 0, padding + edgeWidth, 0);
      ramp.addColorStop(0, 'rgba(0,0,0,0)');
      ramp.addColorStop(start, 'rgba(0,0,0,0)');
      ramp.addColorStop(start + (1 - start) * .25, 'rgba(0,0,0,.08)');
      ramp.addColorStop(start + (1 - start) * .5, 'rgba(0,0,0,.3)');
      ramp.addColorStop(start + (1 - start) * .75, 'rgba(0,0,0,.65)');
      ramp.addColorStop(1, '#000');
      layer.globalCompositeOperation = 'destination-in';
      layer.fillStyle = ramp;
      layer.fillRect(0, 0, tileWidth, tileHeight);
      layer.globalCompositeOperation = 'source-over';
      output.drawImage(this.layer, padding, padding, edgeWidth, edgeHeight, 0, 0, edgeWidth, edgeHeight);
    }
    output.globalAlpha = 1;
    for (const [start, end] of excluded) output.clearRect(0, start * dpr, edgeWidth, (end - start) * dpr);
  }

  dispose() { this.source.width = this.source.height = this.layer.width = this.layer.height = 1; }
}
