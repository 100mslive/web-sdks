/* global Bun */
const fs = require('fs');

async function rebuild(pkg, commonOptions) {
  // Rebuild CJS
  const cjsRebuild = await Bun.build({
    ...commonOptions,
    outdir: './dist',
    naming: 'index.cjs.js',
    format: 'cjs',
  });

  // Rebuild ESM
  const esmRebuild = await Bun.build({
    ...commonOptions,
    outdir: './dist',
    naming: 'index.js',
    format: 'esm',
  });

  if (cjsRebuild.success && esmRebuild.success) {
    console.log(`✔ ${pkg.name}: Rebuilt.`);
  } else {
    console.log(`× ${pkg.name}: Rebuild failed.`);
    if (!cjsRebuild.success) {
      console.log(cjsRebuild.logs);
    }
    if (!esmRebuild.success) {
      console.log(esmRebuild.logs);
    }
  }
}

async function main() {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const source = 'src/App.js';
  const external = Object.keys(pkg.dependencies || {});
  require('dotenv').config();
  const define = { 'process.env': JSON.stringify(process.env) };

  const commonOptions = {
    entrypoints: [source],
    minify: true,
    target: 'browser',
    external,
    sourcemap: 'external',
    define,
    loader: {
      '.svg': 'file',
      '.png': 'file',
    },
  };

  // Initial CJS build
  const cjsResult = await Bun.build({
    ...commonOptions,
    outdir: './dist',
    naming: 'index.cjs.js',
    format: 'cjs',
  });

  if (!cjsResult.success) {
    console.log(`× ${pkg.name}: CJS build failed.`);
    console.log(cjsResult.logs);
  } else {
    console.log(`✔ ${pkg.name}: CJS built.`);
  }

  // Initial ESM build
  const esmResult = await Bun.build({
    ...commonOptions,
    outdir: './dist',
    naming: 'index.js',
    format: 'esm',
  });

  if (!esmResult.success) {
    console.log(`× ${pkg.name}: ESM build failed.`);
    console.log(esmResult.logs);
  } else {
    console.log(`✔ ${pkg.name}: ESM built.`);
  }

  // Watch for changes
  const srcDir = './src';
  console.log(`Watching ${srcDir} for changes...`);

  const watcher = fs.watch(srcDir, { recursive: true }, async (eventType, filename) => {
    if (!filename || (!filename.endsWith('.js') && !filename.endsWith('.jsx'))) {
      return;
    }
    console.log(`File changed: ${filename}`);
    await rebuild(pkg, commonOptions);
  });

  // Keep the process running
  process.on('SIGINT', () => {
    watcher.close();
    process.exit(0);
  });
}

main();
