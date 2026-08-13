// Minifies every assets/*.js source file into an assets/*.min.js counterpart.
// Exposes: run via `npm run js:build` (one-shot) or `npm run js:watch`
// (rebuilds on save, via `--watch`). Per-file minify only (no bundling) —
// scripts load independently per component and coordinate via DOM/custom
// events, not JS imports, so bundling would change load semantics.
// Depends on: esbuild.

import { build, context } from 'esbuild';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.resolve(__dirname, '..', 'assets');
const watchMode = process.argv.includes('--watch');

const sourceFiles = readdirSync(assetsDir)
  .filter((file) => file.endsWith('.js') && !file.endsWith('.min.js'));

if (sourceFiles.length === 0) {
  console.log('No assets/*.js source files found.');
  process.exit(0);
}

const esbuildOptions = (file) => {
  const entry = path.join(assetsDir, file);
  const outfile = path.join(assetsDir, file.replace(/\.js$/, '.min.js'));
  return {
    entryPoints: [entry],
    outfile,
    minify: true,
    bundle: false,
    sourcemap: false,
    target: 'es2018',
    logLevel: 'warning',
  };
};

if (watchMode) {
  const contexts = await Promise.all(
    sourceFiles.map((file) => context(esbuildOptions(file)))
  );
  await Promise.all(contexts.map((ctx) => ctx.watch()));
  console.log(`Watching ${sourceFiles.length} file(s) in assets/ for changes...`);
} else {
  await Promise.all(sourceFiles.map((file) => build(esbuildOptions(file))));
  console.log(`Minified ${sourceFiles.length} file(s) in assets/.`);
}
