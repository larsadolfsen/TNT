const { execSync } = require('child_process');
const esbuild = require('esbuild');
const path = require('path');

async function build() {
  console.log('Bundling extension...');
  await esbuild.build({
    entryPoints: [path.join(__dirname, 'node_modules/@shopify/shopify_function/index.ts')],
    bundle: true,
    outfile: path.join(__dirname, 'dist/function.js'),
    format: 'esm',
    target: 'es2022',
    alias: {
      'user-function': path.join(__dirname, './src/run.js')
    }
  });

  console.log('Compiling JavaScript to WebAssembly using Javy (dynamic linking)...');
  const javyCmd = `npx javy-cli compile "${path.join(__dirname, 'dist/function.js')}" -o "${path.join(__dirname, 'dist/index.wasm')}" -d`;
  execSync(javyCmd, { stdio: 'inherit', cwd: __dirname });
  console.log('Build complete!');
}

build().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
