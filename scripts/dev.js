const fs = require('fs');
const esbuild = require('esbuild');

async function main() {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const source = pkg.name === '@100mslive/react-icons' ? './src/index.tsx' : './src/index.ts';
  const external = Object.keys(pkg.dependencies || {});
  external.push(...Object.keys(pkg.peerDependencies || {}));

  const commonOptions = {
    entryPoints: [source],
    minify: false,
    bundle: true,
    sourcemap: true,
    target: 'esnext',
    tsconfig: 'tsconfig.json',
    external,
    loader: {
      '.png': 'binary',
      '.svg': 'text',
    },
    plugins: [
      {
        name: 'on-rebuild-plugin',
        setup(build) {
          build.onEnd(result => {
            if (result.errors.length > 0) {
              console.log(`× ${pkg.name}: An error prevented the ${build.initialOptions.format} rebuild.`);
              return;
            }
            console.log(`✔ ${pkg.name}: Rebuilt.`);
          });
        },
      },
    ],
  };

  const cjsContext = await esbuild.context({
    outfile: 'dist/index.cjs.js',
    format: 'cjs',
    ...commonOptions,
  });

  const esmContext = await esbuild.context({
    outfile: 'dist/index.js',
    format: 'esm',
    ...commonOptions,
  });

  await cjsContext.rebuild();
  await cjsContext.watch();

  await esmContext.rebuild();
  await esmContext.watch();
}

main();
