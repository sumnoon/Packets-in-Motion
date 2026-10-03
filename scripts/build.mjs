#!/usr/bin/env node
// Builds index.html from src/page.html.
//
//   <!-- include: path -->   is replaced by the contents of src/<path>
//   <!-- datauri: path -->   is replaced by a base64 data: URL of <path> (relative to the repo root)
//
// The course still ships as one self-contained index.html; src/ is only for editing.
// Usage: node scripts/build.mjs           write index.html
//        node scripts/build.mjs --check   fail if index.html is out of date
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {countedReadme} from './course-metadata.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'index.html');
const MIME = { '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.webp': 'image/webp' };

const read = p => fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

export function build() {
  const used = new Set();
  const html = read(path.join(SRC, 'page.html'))
    .replace(/^<!-- include: (\S+) -->$/gm, (_, rel) => {
      used.add(rel);
      return read(path.join(SRC, rel)).replace(/\n+$/, '');
    })
    .replace(/<!-- datauri: (\S+) -->/g, (_, rel) => {
      const mime = MIME[path.extname(rel)];
      if (!mime) throw new Error(`datauri: unknown file type for ${rel}`);
      return `data:${mime};base64,` + fs.readFileSync(path.join(ROOT, rel)).toString('base64');
    });
  // every chapter, challenge and quiz file must be wired into page.html
  for (const dir of ['chapters', 'challenges', 'quizzes']) {
    for (const f of fs.readdirSync(path.join(SRC, dir))) {
      if (f.endsWith('.js') && !used.has(`${dir}/${f}`)) throw new Error(`src/${dir}/${f} is not included in src/page.html`);
    }
  }
  return html;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const html = build();
  const readmePath=path.join(ROOT,'README.md'),readme=read(readmePath),updatedReadme=countedReadme(readme,html);
  if (process.argv.includes('--check')) {
    const current = fs.existsSync(OUT) ? read(OUT) : '';
    if (current !== html) {
      console.error('index.html is out of date. Run: node scripts/build.mjs');
      process.exit(1);
    }
    if(readme!==updatedReadme){console.error('README course counts are out of date. Run: node scripts/build.mjs');process.exit(1);}
    console.log('index.html and README course counts are up to date.');
  } else {
    fs.writeFileSync(OUT, html);
    if(readme!==updatedReadme)fs.writeFileSync(readmePath,updatedReadme);
    console.log(`Wrote index.html (${(Buffer.byteLength(html) / 1024).toFixed(0)} KB)`);
  }
}
