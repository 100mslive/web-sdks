const fs = require('fs');
const esbuild = require('esbuild');
const PostCssPlugin = require('esbuild-plugin-postcss2');
const autoprefixer = require('autoprefixer');

async function main() {
  if (fs.existsSync('./dist')) {
    fs.rmSync('./dist', { recursive: true }, e => {
      if (e) {
        throw e;
      }
    });
  }
  require('dotenv').config();
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const source = './src/index.ts';
  const external = [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {})];
  const loader = { '.js': 'jsx', '.svg': 'file', '.png': 'dataurl' };
  const define = { 'process.env': JSON.stringify(process.env) };
  const plugins = [
    PostCssPlugin.default({
      plugins: [autoprefixer],
    }),
  ];
  try {
    const commonOptions = {
      entryPoints: [source],
      assetNames: '[name]',
      minify: true,
      bundle: true,
      target: 'es6',
      external,
      treeShaking: true,
      sourcemap: true,
      loader,
      define,
      plugins,
    };

    esbuild.build({
      outfile: 'dist/index.cjs.js',
      format: 'cjs',
      ...commonOptions,
    });

    esbuild.build({
      entryPoints: [source],
      outdir: 'dist/',
      format: 'esm',
      splitting: true,
      ...commonOptions,
    });
  } catch (e) {
    console.log(`× ${pkg.name}: Build failed due to an error.`);
    console.log(e);
  }
}

main();
