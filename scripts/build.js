const fs = require('fs');
const esbuild = require('esbuild');
const { gzip } = require('zlib');

const getSourceForPackage = packageName => {
  if (packageName === '@100mslive/react-icons') {
    return ['./src/index.tsx'];
  }
  // Separate both vb packages for browser compatibility - effects plugin is not supported on Safari versions <= 16.5.1
  if (packageName === '@100mslive/hms-virtual-background') {
    return ['./src/index.ts', './src/HMSEffectsPlugin.ts', './src/HMSVBPlugin.ts'];
  }
  return ['./src/index.ts'];
};

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
  const source = getSourceForPackage(pkg.name);
  const external = Object.keys(pkg.dependencies || {});
  external.push(...Object.keys(pkg.peerDependencies || {}));

  const commonOptions = {
    entryPoints: source,
    bundle: true,
    target: ['es2015', 'chrome58', 'firefox57', 'safari11', 'edge16', 'node12', 'es6'],
    external,
    tsconfig: 'tsconfig.json',
    minify: true,
    sourcemap: true,
    treeShaking: true,
  };
  try {
    let esmResult;
    // outfile (single output) and outdir (multiple output files) cannot be used together
    if (pkg.name !== '@100mslive/hms-virtual-background') {
      await esbuild.build({
        ...commonOptions,
        outfile: 'dist/index.cjs.js',
        format: 'cjs',
      });

      esmResult = await esbuild.build({
        ...commonOptions,
        outfile: 'dist/index.js',
        format: 'esm',
        metafile: true,
      });
    } else {
      await esbuild.build({
        ...commonOptions,
        outdir: 'dist',
        format: 'cjs',
      });

      esmResult = await esbuild.build({
        ...commonOptions,
        outdir: 'dist',
        format: 'esm',
        splitting: true,
        chunkNames: 'chunks/[name]-[hash]',
        metafile: true,
      });
    }

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
