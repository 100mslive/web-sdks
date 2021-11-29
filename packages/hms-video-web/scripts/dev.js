/* eslint-disable */
const esbuild = require('esbuild');
const pkg = require('../package.json');

async function main() {
  esbuild.build({
    entryPoints: ['./src/index.ts'],
    outfile: 'dist/hms-video.esm.js',
    minify: false,
    bundle: true,
    format: 'esm',
    target: 'es6',
    tsconfig: './tsconfig.build.json',
    external: Object.keys(pkg.dependencies),
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
