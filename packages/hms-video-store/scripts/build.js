/* eslint-disable */
const fs = require('fs');
const esbuild = require('esbuild');
const { gzip } = require('zlib');
const pkg = require('../package.json');

async function main() {
  if (fs.existsSync('./dist')) {
    fs.rmSync('./dist', { recursive: true }, e => {
      if (e) {
        throw e;
      }
    });
  }

  console.log('add test log');
  try {
    esbuild.buildSync({
      entryPoints: ['./src/index.ts'],
      outfile: 'dist/hms-video-store.cjs.js',
      minify: true,
      bundle: true,
      format: 'cjs',
      target: 'es6',
      tsconfig: './tsconfig.build.json',
      external: Object.keys(pkg.dependencies).concat(Object.keys(pkg.peerDependencies)),
      metafile: true,
    });

    const esmResult = esbuild.buildSync({
      entryPoints: ['./src/index.ts'],
      outfile: 'dist/hms-video-store.esm.js',
      minify: true,
      bundle: true,
      format: 'esm',
      target: 'es6',
      tsconfig: './tsconfig.build.json',
      external: Object.keys(pkg.dependencies).concat(Object.keys(pkg.peerDependencies)),
      metafile: true,
    });

    let esmSize = 0;
    Object.values(esmResult.metafile.outputs).forEach(output => {
      esmSize += output.bytes;
    });

    fs.readFile('./dist/hms-video-store.esm.js', (_err, data) => {
      gzip(data, (_err, result) => {
        console.log(
          `✔ ${pkg.name}: Built pkg. ${(esmSize / 1000).toFixed(2)}kb (${(result.length / 1000).toFixed(
            2,
          )}kb minified)`,
        );
      });
    });
  } catch (e) {
    console.log(`× ${pkg.name}: Build failed due to an error.`);
    console.log(e);
  }
}

main();
