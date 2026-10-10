import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Reproducible lossless extraction. No fps/scale filter: keep every decoded frame.
const source = process.argv[2];
if (!source) throw new Error("Pass the original portrait MP4 path.");
const destination = fileURLToPath(new URL("../public/hero-frames-mobile-curls/", import.meta.url));
mkdirSync(destination, { recursive: true });
if (readdirSync(destination).length) throw new Error("Destination must be empty; existing assets will not be overwritten.");
const probe = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_streams", "-show_frames", "-of", "json", source], { maxBuffer: 8 * 1024 * 1024 }));
const stream = probe.streams[0];
if (stream.width !== 720 || stream.height !== 1280 || probe.frames.length !== 121) {
  throw new Error("Unexpected source: this sequence expects the approved 720x1280 / 121-frame clip.");
}
const masters = mkdtempSync(path.join(tmpdir(), "kratos-curls-"));
try {
  const result = spawnSync("ffmpeg", ["-nostdin", "-v", "error", "-i", source, "-map", "0:v:0", "-an", "-fps_mode", "passthrough", "-c:v", "png", "-pix_fmt", "rgb24", "-start_number", "1", path.join(masters, "frame_%03d.png")], { stdio: "inherit" });
  if (result.status !== 0) throw new Error("Frame extraction failed.");
  for (let index = 1; index <= probe.frames.length; index++) {
    const basename = `frame_${String(index).padStart(3, "0")}`;
    const original = path.join(masters, `${basename}.png`);
    const output = path.join(destination, `${basename}.webp`);
    await sharp(original).webp({ lossless: true, effort: 6 }).toFile(output);
    const before = await sharp(original).raw().toBuffer();
    const after = await sharp(output).raw().toBuffer();
    if (!before.equals(after)) throw new Error(`Pixel verification failed: ${basename}`);
  }
} finally {
  rmSync(masters, { recursive: true });
}
const manifest = {
  source: path.basename(source),
  sourceSha256: createHash("sha256").update(readFileSync(source)).digest("hex"),
  width: stream.width, height: stream.height, frameCount: probe.frames.length,
  lossless: true, format: "WebP lossless (VP8L)",
  timestamps: probe.frames.map(frame => Number(frame.best_effort_timestamp_time)),
};
writeFileSync(path.join(destination, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`Extracted ${manifest.frameCount} lossless ${manifest.width}x${manifest.height} frames.`);
