const fs = require('fs');
const esbuild = require('esbuild');
const PostCssPlugin = require('esbuild-plugin-postcss2');
const autoprefixer = require('autoprefixer');
const tailwindcss = require('tailwindcss');

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
  const source = './src/App.js';
  const external = Object.keys(pkg.dependencies || {});
  const loader = { '.js': 'jsx', '.svg': 'file', '.png': 'dataurl' };
  const define = { 'process.env': JSON.stringify(process.env) };
  const plugins = [
    PostCssPlugin.default({
      plugins: [tailwindcss, autoprefixer],
    }),
  ];
  try {
    esbuild.build({
      entryPoints: [source],
      outfile: 'dist/index.cjs.js',
      assetNames: '[name]',
      minify: false,
      bundle: true,
      format: 'cjs',
      target: 'es6',
      external,
      metafile: false,
      loader,
      define,
      plugins,
    });

    esbuild.build({
      entryPoints: [source],
      outfile: 'dist/index.js',
      assetNames: '[name]',
      minify: false,
      bundle: true,
      format: 'esm',
      target: 'es6',
      external,
      metafile: true,
      loader,
      define,
      plugins,
    });
  } catch (e) {
    console.log(`× ${pkg.name}: Build failed due to an error.`);
    console.log(e);
  }
}

main();
