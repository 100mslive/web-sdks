/* eslint-disable complexity */
const fs = require('fs');
const esbuild = require('esbuild');
const { solidPlugin } = require('esbuild-plugin-solid');

async function main() {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const source = pkg.name === '@100mslive/react-icons' ? './src/index.tsx' : './src/index.ts';
  const isReact = pkg.name.includes('react');
  const isSolid = pkg.name.includes('solid');
  const external = Object.keys(pkg.dependencies || {});
  if (isReact) {
    external.push('react');
  } else if (isSolid) {
    external.push('solid-js');
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
    plugins: isSolid ? [solidPlugin()] : [],
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
    plugins: isSolid ? [solidPlugin()] : [],
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
