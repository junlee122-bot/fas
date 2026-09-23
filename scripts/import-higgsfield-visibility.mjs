import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const sharp = require(process.env.SHARP_PATH || 'sharp');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await fs.readFile(path.join(root, 'design/higgsfield-visibility-2026-09-23.json'), 'utf8'));
const source = path.join(root, 'design/source-assets/visibility');
const runtime = path.join(root, 'src/assets/access-rights');
await fs.mkdir(source, { recursive: true });
await fs.mkdir(runtime, { recursive: true });
const report = [];
for (const item of manifest.requests) {
  if (!['transit-corridor', 'naval-basing'].includes(item.slug)) throw new Error('Unexpected asset id');
  const png = path.join(source, item.slug + '.png');
  const webp = path.join(runtime, item.slug + '.webp');
  try { await fs.access(png); } catch {
    const response = await fetch(item.url);
    if (!response.ok) throw new Error(`Asset download failed: ${response.status}`);
    await fs.writeFile(png, Buffer.from(await response.arrayBuffer()), { flag: 'wx' });
  }
  const metadata = await sharp(png).metadata();
  if (metadata.width !== manifest.nativeWidth || metadata.height !== manifest.nativeHeight) throw new Error('Unexpected native dimensions');
  try { await fs.access(webp); } catch { await sharp(png).webp({ lossless: true, effort: 6 }).toFile(webp); }
  const original = await sharp(png).ensureAlpha().raw().toBuffer();
  const converted = await sharp(webp).ensureAlpha().raw().toBuffer();
  if (!original.equals(converted)) throw new Error('Lossless pixel check failed');
  const row = { slug: item.slug, job_id: item.job_id, width: metadata.width, height: metadata.height,
    originalBytes: (await fs.stat(png)).size, webpBytes: (await fs.stat(webp)).size,
    sha256: createHash('sha256').update(await fs.readFile(png)).digest('hex'), losslessVerified: true };
  report.push(row); console.log(JSON.stringify(row));
}
await fs.writeFile(path.join(root, 'design/higgsfield-visibility-validation-2026-09-23.json'), JSON.stringify(report, null, 2) + '\n');
