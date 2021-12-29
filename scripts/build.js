/* eslint-disable */
const fs = require('fs');
const esbuild = require('esbuild');
const { gzip } = require('zlib');

async function main() {
  if (fs.existsSync('./dist')) {
    fs.rmSync('./dist', { recursive: true }, e => {
      if (e) {
        throw e;
      }
    });
  }
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const source = pkg.name === '@100mslive/react-icons' ? './src/index.tsx' : './src/index.ts';
  try {
    esbuild.buildSync({
      entryPoints: [source],
      outfile: 'dist/index.cjs.js',
      minify: true,
      bundle: true,
      format: 'cjs',
      target: 'es6',
      tsconfig: 'tsconfig.json',
      external: Object.keys(pkg.dependencies || {}),
      metafile: true,
    });

    const esmResult = esbuild.buildSync({
      entryPoints: [source],
      outfile: 'dist/index.esm.js',
      minify: true,
      bundle: true,
      format: 'esm',
      target: 'es6',
      tsconfig: 'tsconfig.build.json',
      external: Object.keys(pkg.dependencies || {}),
      metafile: true,
    });

    let esmSize = 0;
    Object.values(esmResult.metafile.outputs).forEach(output => {
      esmSize += output.bytes;
    });

    fs.readFile('./dist/index.esm.js', (_err, data) => {
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
