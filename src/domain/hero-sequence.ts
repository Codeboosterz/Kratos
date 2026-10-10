import mobileSequence from "../../public/hero-frames-mobile-curls/manifest.json";

export function heroFrameSource(index: number, mobile: boolean) {
  const number = String(index + 1).padStart(3, "0");
  return mobile ? `/hero-frames-mobile-curls/frame_${number}.webp` : `/hero-frames/frame_${number}.jpg`;
}

export function mobileFrameAtProgress(progress: number) {
  const timestamps = mobileSequence.timestamps;
  const time = Math.max(0, Math.min(1, progress)) * timestamps[timestamps.length - 1];
  let low = 0;
  let high = timestamps.length - 1;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (timestamps[middle] <= time) low = middle;
    else high = middle - 1;
  }
  return low;
}

export function mobileCanvasRatio(width: number, height: number, deviceRatio: number) {
  return Math.min(deviceRatio || 1, 2, mobileSequence.width / Math.max(1, width), mobileSequence.height / Math.max(1, height));
}
