const fs = require('fs');
const esbuild = require('esbuild');

async function main() {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const source = pkg.name === '@100mslive/react-icons' ? './src/index.tsx' : './src/index.ts';
  const isReact = pkg.name.includes('react');
  const external = Object.keys(pkg.dependencies || {});
  if (isReact) {
    external.push('react');
  }
  if (pkg.name === '@100mslive/hms-noise-suppression') {
    external.push('fs', 'path');
  }
  esbuild.build({
    entryPoints: [source],
    outfile: 'dist/index.cjs.js',
    minify: true,
    bundle: true,
    format: 'cjs',
    target: 'es6',
    tsconfig: 'tsconfig.json',
    external,
    metafile: true,
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
    tsconfig: './tsconfig.build.json',
    external,
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
