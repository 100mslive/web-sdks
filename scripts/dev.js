/* eslint-disable */
const esbuild = require('esbuild');

async function main() {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const source = pkg.name === '@100mslive/react-icons' ? './src/index.tsx' : './src/index.ts';
  const isReact = pkg.name.includes('react');
  const external = Object.keys(pkg.dependencies || {});
  if (isReact) {
    external.push('react');
  }
  esbuild.build({
    entryPoints: [source],
    outfile: 'dist/hms-video.esm.js',
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
