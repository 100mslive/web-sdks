const fs = require('fs');
const esbuild = require('esbuild');
const { gzip } = require('zlib');
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
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const source = './src/App.js';
  const external = Object.keys(pkg.dependencies || {});
  const loader = { '.js': 'jsx', '.svg': 'file', '.png': 'file' };
  const plugins = [
    PostCssPlugin.default({
      plugins: [tailwindcss, autoprefixer],
    }),
  ];
  try {
    esbuild.build({
      entryPoints: [source],
      outfile: 'dist/index.cjs.js',
      minify: false,
      bundle: true,
      format: 'cjs',
      target: 'es6',
      external,
      metafile: true,
      loader,
      plugins,
    });

    const esmResult = esbuild.build({
      entryPoints: [source],
      outfile: 'dist/index.js',
      minify: true,
      bundle: true,
      format: 'esm',
      target: 'es6',
      external,
      metafile: true,
      loader,
      plugins,
    });

    let esmSize = 0;
    Object.values(esmResult.metafile?.outputs || {}).forEach(output => {
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
