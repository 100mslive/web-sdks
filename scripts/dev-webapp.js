const fs = require('fs');
const esbuild = require('esbuild');

async function main() {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const source = 'src/App.js';
  const external = Object.keys(pkg.dependencies || {});
  const loader = { '.js': 'jsx', '.svg': 'dataurl', '.png': 'dataurl' };
  require('dotenv').config();
  const define = { 'process.env': JSON.stringify(process.env) };
  const commonOptions = {
    entryPoints: [source],
    assetNames: '[name]',
    minify: true,
    bundle: true,
    format: 'cjs',
    target: 'es6',
    external,
    metafile: true,
    sourcemap: true,
    loader,
    define,
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

  const context = await esbuild.context({
    outfile: 'dist/index.cjs.js',
    ...commonOptions,
  });

  const esmContext = await esbuild.context({
    outfile: 'dist/index.js',
    format: 'esm',
    ...commonOptions,
  });

  await context.rebuild();
  await context.watch();

  await esmContext.rebuild();
  await esmContext.watch();
}

main();
