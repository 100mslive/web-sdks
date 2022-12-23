const fs = require('fs');
const esbuild = require('esbuild');

async function main() {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const source = pkg.name === '@100mslive/react-icons' ? './src/index.tsx' : './src/index.ts';
  const external = Object.keys(pkg.dependencies || {});
  external.push(...Object.keys(pkg.peerDependencies || {}));
  if (pkg.name === '@100mslive/hms-noise-suppression') {
    external.push('fs', 'path', './src/models/Noise.js');
  }
  const commonOptions = {
    entryPoints: [source],
    minify: false,
    bundle: true,
    target: 'esnext',
    tsconfig: 'tsconfig.json',
    external,
  };
  esbuild.build({
    outfile: 'dist/index.cjs.js',
    format: 'cjs',
    watch: {
      onRebuild(error) {
        if (error) {
          console.log(`× ${pkg.name}: An error in prevented the cjs rebuild.`);
          return;
        }
        console.log(`✔ ${pkg.name}: Rebuilt.`);
      },
    },
    ...commonOptions,
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
