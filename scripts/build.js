const fs = require('fs');
const esbuild = require('esbuild');
const { gzip } = require('zlib');

// eslint-disable-next-line complexity
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
  const external = Object.keys(pkg.dependencies || {});
  external.push(...Object.keys(pkg.peerDependencies || {}));

  const commonOptions = {
    entryPoints: [source],
    bundle: true,
    target: 'es6',
    external,
    tsconfig: 'tsconfig.json',
    minify: true,
    sourcemap: true,
  };
  try {
    await esbuild.build({
      ...commonOptions,
      outfile: 'dist/index.cjs.js',
      format: 'cjs',
    });

    const esmResult = await esbuild.build({
      ...commonOptions,
      outfile: 'dist/index.js',
      format: 'esm',
      metafile: true,
    });

    let esmSize = 0;
    Object.values(esmResult.metafile.outputs).forEach(output => {
      esmSize += output.bytes;
    });

    fs.readFile('./dist/index.js', (_err, data) => {
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
