import inventory from "@/src/generated/public-media-inventory.json";

export type MediaStats = {
  count: number;
  sizeBytes: number;
};

export const bundledMediaStats: MediaStats = {
  count: inventory.count,
  sizeBytes: inventory.sizeBytes,
};

export function combineMediaStats(uploadedCount = 0, uploadedSizeBytes = 0): MediaStats {
  return {
    count: bundledMediaStats.count + uploadedCount,
    sizeBytes: bundledMediaStats.sizeBytes + uploadedSizeBytes,
  };
}

export function formatMediaSize(sizeBytes: number) {
  const megabytes = sizeBytes / 1024 / 1024;
  return `${new Intl.NumberFormat("nl-BE", { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(megabytes)} MB`;
}
