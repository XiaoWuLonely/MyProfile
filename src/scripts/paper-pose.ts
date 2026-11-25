interface PaperSize {
  width: number;
  height: number;
}

export interface PaperBox extends PaperSize {
  x: number;
  y: number;
}

export function scaledPaperPose(box: PaperBox, size: PaperSize, originY = 0.5) {
  const width = Math.max(size.width, 1);
  const height = Math.max(size.height, 1);
  // Keep the measured position of the transform origin as the paper scales.
  return {
    x: box.x + (box.width - width) / 2,
    y: box.y + (box.height - height) * originY,
    scaleX: box.width / width,
    scaleY: box.height / height,
  };
}
