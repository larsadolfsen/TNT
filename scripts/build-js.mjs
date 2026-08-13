// Minifies every assets/*.js source file into an assets/*.min.js counterpart.
// Exposes: run via `npm run js:build`. Per-file minify only (no bundling) —
// scripts load independently per component and coordinate via DOM/custom
// events, not JS imports, so bundling would change load semantics.
// Depends on: esbuild.

import { build } from 'esbuild';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.resolve(__dirname, '..', 'assets');

const sourceFiles = readdirSync(assetsDir)
  .filter((file) => file.endsWith('.js') && !file.endsWith('.min.js'));

if (sourceFiles.length === 0) {
  console.log('No assets/*.js source files found.');
  process.exit(0);
}

await Promise.all(
  sourceFiles.map((file) => {
    const entry = path.join(assetsDir, file);
    const outfile = path.join(assetsDir, file.replace(/\.js$/, '.min.js'));
    return build({
      entryPoints: [entry],
      outfile,
      minify: true,
      bundle: false,
      sourcemap: false,
      target: 'es2018',
      logLevel: 'warning',
    });
  })
);

console.log(`Minified ${sourceFiles.length} file(s) in assets/.`);
