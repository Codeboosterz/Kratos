import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const publicRoot = path.join(projectRoot, "public");
const outputPath = path.join(projectRoot, "src/generated/public-media-inventory.json");
const sourceRoots = ["app", "components", "src", "config", "motion", "design-system"];
const mediaExtensions = new Set([".avif", ".gif", ".jpeg", ".jpg", ".mp4", ".png", ".svg", ".webm", ".webp"]);
const sourceExtensions = new Set([".css", ".js", ".json", ".jsx", ".mdx", ".scss", ".ts", ".tsx"]);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  }));
  return files.flat();
}

const sourceFiles = (await Promise.all(sourceRoots.map(async (directory) => {
  const absolute = path.join(projectRoot, directory);
  try {
    return await walk(absolute);
  } catch {
    return [];
  }
}))).flat().filter((file) => sourceExtensions.has(path.extname(file).toLowerCase()) && file !== outputPath);

const sourceCorpus = (await Promise.all(sourceFiles.map((file) => readFile(file, "utf8")))).join("\n");
const mediaFiles = (await walk(publicRoot)).filter((file) => mediaExtensions.has(path.extname(file).toLowerCase()));

const activeFiles = [];
for (const file of mediaFiles) {
  const publicPath = `/${path.relative(publicRoot, file).split(path.sep).join("/")}`;
  const referencedDirectly = sourceCorpus.includes(publicPath);
  const referencedAsSequence = publicPath.startsWith("/hero-frames/") && sourceCorpus.includes("/hero-frames/");

  if (referencedDirectly || referencedAsSequence) {
    const details = await stat(file);
    activeFiles.push({ path: publicPath, sizeBytes: details.size });
  }
}

activeFiles.sort((left, right) => left.path.localeCompare(right.path));
const inventory = {
  count: activeFiles.length,
  sizeBytes: activeFiles.reduce((total, file) => total + file.sizeBytes, 0),
  files: activeFiles,
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(inventory, null, 2)}\n`, "utf8");
console.log(`Media inventory: ${inventory.count} active files (${inventory.sizeBytes} bytes)`);
