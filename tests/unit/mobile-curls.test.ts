import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { heroFrameSource, mobileFrameAtProgress, mobileCanvasRatio } from "../../src/domain/hero-sequence";

describe("native-quality mobile curl sequence", () => {
  it("keeps mobile assets separate from the approved desktop sequence", () => {
    expect(heroFrameSource(0, false)).toBe("/hero-frames/frame_001.jpg");
    expect(heroFrameSource(120, false)).toBe("/hero-frames/frame_121.jpg");
    expect(heroFrameSource(0, true)).toBe("/hero-frames-mobile-curls/frame_001.webp");
    expect(heroFrameSource(120, true)).toBe("/hero-frames-mobile-curls/frame_121.webp");
  });
  it("maps original timestamps monotonically, clamps and reverses", () => {
    expect(mobileFrameAtProgress(-1)).toBe(0);
    expect(mobileFrameAtProgress(1)).toBe(120);
    expect(mobileFrameAtProgress(5)).toBe(120);
    expect(mobileFrameAtProgress(0)).toBe(0);
    const samples = Array.from({ length: 121 }, (_, i) => mobileFrameAtProgress(i / 120));
    expect(samples).toEqual([...samples].sort((a, b) => a - b));
    expect(mobileFrameAtProgress(.5)).toBe(60);
  });
  it("uses the available source detail without oversized canvas allocation", () => {
    expect(mobileCanvasRatio(390, 776, 3)).toBeGreaterThan(1);
    expect(mobileCanvasRatio(390, 776, 3) * 776).toBeLessThanOrEqual(1280);
    expect(mobileCanvasRatio(390, 776, 1)).toBe(1);
  });
  it("ships every frame losslessly at native resolution", () => {
    const manifest = JSON.parse(readFileSync("public/hero-frames-mobile-curls/manifest.json", "utf8"));
    expect(manifest).toMatchObject({ width: 720, height: 1280, frameCount: 121, lossless: true });
    expect(manifest.timestamps).toHaveLength(121);
    expect(readdirSync("public/hero-frames-mobile-curls").filter(p => p.endsWith(".webp"))).toHaveLength(121);
    for (const n of ["001", "061", "121"]) {
      const bytes = readFileSync(`public/hero-frames-mobile-curls/frame_${n}.webp`);
      expect(bytes.toString("ascii", 0, 4)).toBe("RIFF");
      expect(bytes.toString("ascii", 12, 16)).toBe("VP8L");
    }
  });
});
