import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const sharp = require(process.env.SHARP_PATH || 'sharp');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const production = JSON.parse(await fs.readFile(path.join(root, 'design/higgsfield-portraits-production.json'), 'utf8'));
const manifest = JSON.parse(await fs.readFile(path.join(root, 'design/higgsfield-portraits-generation.json'), 'utf8'));
const people = production.requests.filter((p) => manifest.jobs.some((j) => j.index === p.index && j.status === 'completed'));
const size = 224, cellW = 248, cellH = 276, cols = 6, top = 72;
const layers = [];
const escape = (value) => value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
layers.push({ input: Buffer.from(`<svg width="${cols*cellW}" height="70"><text x="20" y="32" font-family="Malgun Gothic,sans-serif" font-size="22" fill="#ede4d2">IRON DOMINION · 실존 인물 기반 생성 초상 22명</text><text x="20" y="57" font-family="Malgun Gothic,sans-serif" font-size="14" fill="#b4c0b6">1940년대 참고 외형 · AI 재구성 · 실제 사진 아님</text></svg>`), top: 0, left: 0 });
for (let i=0; i<people.length; i++) {
  const person = people[i], left = (i%cols)*cellW+12, y = Math.floor(i/cols)*cellH+top;
  layers.push({ input: await sharp(path.join(root, 'src/assets/portraits', person.id+'.webp')).resize(size,size).png().toBuffer(), left, top:y });
  layers.push({ input: Buffer.from(`<svg width="${cellW}" height="44"><text x="12" y="24" font-family="Malgun Gothic,sans-serif" font-size="15" fill="#e2d8c4">${escape(person.name)}</text></svg>`), left: left-12, top:y+size });
}
const output = path.join(root,'docs/higgsfield-portraits-contact-sheet.png');
await sharp({create:{width:cols*cellW,height:top+Math.ceil(people.length/cols)*cellH,channels:3,background:'#151e20'}}).composite(layers).png().toFile(output);
console.log(output);
