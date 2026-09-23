import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const sharp = require(process.env.SHARP_PATH || 'sharp');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await fs.readFile(path.join(root, 'design/higgsfield-portraits-generation.json'), 'utf8'));
const production = JSON.parse(await fs.readFile(path.join(root, 'design/higgsfield-portraits-production.json'), 'utf8'));
await fs.mkdir(path.join(root, 'design/source-assets/portraits'), { recursive: true });
await fs.mkdir(path.join(root, 'src/assets/portraits'), { recursive: true });
const report = [];
const completed = manifest.jobs.filter((item) => item.status === 'completed' && item.result_url);
for (let offset = 0; offset < completed.length; offset += 4) {
 await Promise.all(completed.slice(offset, offset + 4).map(async (job) => {
  const request = production.requests.find((item) => item.index === job.index);
  if (!request || !/^[a-z-]+$/.test(request.id)) throw new Error('Unknown portrait identity');
  const sourcePath = path.join(root, 'design/source-assets/portraits', request.id + '.png');
  const outputPath = path.join(root, 'src/assets/portraits', request.id + '.webp');
  try { await fs.access(sourcePath); } catch {
    const response = await fetch(job.result_url);
    if (!response.ok) throw new Error(`Download failed: ${response.status} ${request.id}`);
    await fs.writeFile(sourcePath, Buffer.from(await response.arrayBuffer()));
  }
  const metadata = await sharp(sourcePath).metadata();
  if (metadata.width !== 2048 || metadata.height !== 2048) throw new Error(`Unexpected native dimensions: ${request.id}`);
  try { await fs.access(outputPath); } catch { await sharp(sourcePath).webp({ lossless: true, effort: 6 }).toFile(outputPath); }
  const sourcePixels = await sharp(sourcePath).ensureAlpha().raw().toBuffer();
  const runtimePixels = await sharp(outputPath).ensureAlpha().raw().toBuffer();
  if (!sourcePixels.equals(runtimePixels)) throw new Error(`Pixel mismatch: ${request.id}`);
  report.push({ id: request.id, width: metadata.width, height: metadata.height, pngBytes: (await fs.stat(sourcePath)).size, webpBytes: (await fs.stat(outputPath)).size, losslessVerified: true });
  console.log(`Imported ${request.id}: 2048 × 2048, lossless verified`);
 }));
}
console.log(JSON.stringify(report, null, 2));
