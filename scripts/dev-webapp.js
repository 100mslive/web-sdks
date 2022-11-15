const fs = require('fs');
const esbuild = require('esbuild');

async function main() {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const source = 'src/App.js';
  const external = Object.keys(pkg.dependencies || {});
  const loader = { '.js': 'jsx', '.svg': 'dataurl', '.png': 'dataurl' };
  require('dotenv').config();
  const define = { 'process.env': JSON.stringify(process.env) };
  const commonOptions = {
    entryPoints: [source],
    assetNames: '[name]',
    minify: true,
    bundle: true,
    format: 'cjs',
    target: 'es6',
    external,
    metafile: true,
    sourcemap: true,
    loader,
    define,
  };

  esbuild.build({
    outfile: 'dist/index.cjs.js',
    ...commonOptions,
    watch: {
      onRebuild(error) {
        if (error) {
          console.log(`× ${pkg.name}: An error in prevented the cjs rebuild.`);
          return;
        }
        console.log(`✔ ${pkg.name}: Rebuilt.`);
      },
    },
  });

  esbuild.build({
    outfile: 'dist/index.js',
    format: 'esm',
    ...commonOptions,
    watch: {
      onRebuild(error) {
        if (error) {
          console.log(`× ${pkg.name}: An error in prevented the esm rebuild.`);
          return;
        }
        console.log(`✔ ${pkg.name}: Rebuilt.`);
      },
    },
  });
}

main();
