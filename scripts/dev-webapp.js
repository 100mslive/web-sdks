const fs = require('fs');
const esbuild = require('esbuild');

async function main() {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const source = 'src/App.js';
  const external = Object.keys(pkg.dependencies || {});
  const loader = { '.js': 'jsx', '.svg': 'file', '.png': 'file' };

  esbuild.build({
    entryPoints: [source],
    outfile: 'dist/index.cjs.js',
    minify: true,
    bundle: true,
    format: 'cjs',
    target: 'es6',
    external,
    metafile: true,
    loader,
    watch: {
      onRebuild(error) {
        if (error) {
          console.log(`× ${pkg.name}: An error in prevented the rebuild.`);
          return;
        }
        console.log(`✔ ${pkg.name}: Rebuilt.`);
      },
    },
  });

  esbuild.build({
    entryPoints: [source],
    outfile: 'dist/index.js',
    minify: false,
    bundle: true,
    format: 'esm',
    target: 'es6',
    external,
    loader,
    sourcemap: true,
    incremental: true,
    treeShaking: true,
    watch: {
      onRebuild(error) {
        if (error) {
          console.log(`× ${pkg.name}: An error in prevented the rebuild.`);
          return;
        }
        console.log(`✔ ${pkg.name}: Rebuilt.`);
      },
    },
  });
}

main();
