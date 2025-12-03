/* global Bun */
const fs = require('fs');
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
    entrypoints: source,
    target: 'browser',
    external,
    minify: true,
    sourcemap: 'external',
  };

  try {
    let esmResult;
    // outfile (single output) and outdir (multiple output files) cannot be used together
    if (pkg.name !== '@100mslive/hms-virtual-background') {
      await Bun.build({
        ...commonOptions,
        outdir: './dist',
        naming: 'index.cjs.js',
        format: 'cjs',
      });

      esmResult = await Bun.build({
        ...commonOptions,
        outdir: './dist',
        naming: 'index.js',
        format: 'esm',
      });
    } else {
      console.log('here');
      await Bun.build({
        ...commonOptions,
        outdir: 'dist/cjs',
        format: 'cjs',
      });

      esmResult = await Bun.build({
        ...commonOptions,
        outdir: 'dist/esm',
        format: 'esm',
      });
    }

    if (!esmResult.success) {
      console.log(`× ${pkg.name}: Build failed due to an error.`);
      console.log(esmResult.logs);
      process.exit(1);
    }

    let esmSize = 0;
    for (const output of esmResult.outputs) {
      const text = await output.text();
      esmSize += text.length;
    }

    fs.readFile('./dist/index.js', (_err, data) => {
      if (_err || !data) {
        console.log(`✔ ${pkg.name}: Built pkg. ${(esmSize / 1000).toFixed(2)}kb`);
        return;
      }
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
    process.exit(1);
  }
}

main();
