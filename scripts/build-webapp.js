/* global Bun */
const fs = require('fs');
const path = require('path');

// eslint-disable-next-line complexity
async function main() {
  if (fs.existsSync('./dist')) {
    fs.rmSync('./dist', { recursive: true }, e => {
      if (e) {
        throw e;
      }
    });
  }
  require('dotenv').config();
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const source = pkg.name === '@100mslive/roomkit-web' ? './src/index.js' : './src/index.ts';
  const allExternal = [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {})];

  // Don't externalize CSS files - we want to bundle them
  const externalFilter = allExternal.filter(dep => !dep.includes('css'));

  const define = { 'process.env': JSON.stringify(process.env) };
  const target = 'browser';

  try {
    const commonOptions = {
      entrypoints: [source],
      minify: false,
      target,
      external: externalFilter,
      sourcemap: 'external',
      define,
      loader: {
        '.svg': 'file',
        '.png': 'file',
      },
    };

    // CJS build
    const cjsResult = await Bun.build({
      ...commonOptions,
      outdir: './dist',
      naming: 'index.cjs.js',
      format: 'cjs',
    });

    if (cjsResult.success) {
      console.log('cjs build successful');
      console.log('creating build dependency file');
      // Write a simple meta file
      fs.writeFileSync('dist/meta.cjs.json', JSON.stringify({ outputs: cjsResult.outputs.length }, null, 2), 'utf-8');
    } else {
      console.log('cjs build failed');
      console.log(cjsResult.logs);
      process.exit(1);
    }

    // ESM build with splitting
    const esmResult = await Bun.build({
      ...commonOptions,
      outdir: './dist',
      format: 'esm',
      splitting: true,
    });

    if (esmResult.success) {
      console.log('esm build successful');
      console.log('creating build dependency file');
      fs.writeFileSync('dist/meta.esm.json', JSON.stringify({ outputs: esmResult.outputs.length }, null, 2), 'utf-8');

      // Check if any CSS was generated and rename it to index.css
      for (const output of esmResult.outputs) {
        if (output.path.endsWith('.css')) {
          const cssContent = await output.text();
          fs.writeFileSync('dist/index.css', cssContent, 'utf-8');
          console.log('css bundle created');
          break;
        }
      }

      // If no CSS was bundled, check if we need to copy from dependencies
      if (!fs.existsSync('dist/index.css')) {
        // For roomkit-react, copy CSS from hms-whiteboard
        const whiteboardCss = path.resolve(__dirname, '../packages/hms-whiteboard/dist/index.css');
        if (fs.existsSync(whiteboardCss)) {
          fs.copyFileSync(whiteboardCss, 'dist/index.css');
          console.log('copied css from hms-whiteboard');
        }
      }
    } else {
      console.log('esm build failed');
      console.log(esmResult.logs);
      process.exit(1);
    }
  } catch (e) {
    console.log(`× ${pkg.name}: Build failed due to an error.`);
    console.log(e);
    process.exit(1);
  }
}

main();
