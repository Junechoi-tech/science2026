import { copyFile, cp, mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
// Keep both GitHub Pages modes working: Actions (dist/) and main branch (/).
await rename(`${root}dist/app.html`, `${root}dist/index.html`);
await writeFile(`${root}dist/.nojekyll`, '');
await copyFile(`${root}dist/index.html`, `${root}index.html`);
await rm(`${root}assets`, { recursive: true, force: true });
await mkdir(`${root}assets`, { recursive: true });
await cp(`${root}dist/assets`, `${root}assets`, { recursive: true });
await writeFile(`${root}.nojekyll`, '');
console.log('Prepared dist/ and main-branch static site. No build server is needed to serve the repository root.');
