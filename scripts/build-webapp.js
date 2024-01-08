const fs = require('fs');
const esbuild = require('esbuild');
const PostCssPlugin = require('esbuild-plugin-postcss2');
const autoprefixer = require('autoprefixer');

// eslint-disable-next-line complexity
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
  const source = pkg.name === '@100mslive/roomkit-web' ? './src/index.js' : './src/index.ts';
  const external = [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {})];
  const loader = { '.js': 'jsx', '.svg': 'dataurl', '.png': 'dataurl' };
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
      minify: false,
      bundle: true,
      target: 'es6',
      external,
      treeShaking: true,
      sourcemap: true,
      metafile: true,
      loader,
      define,
      plugins,
    };

    esbuild
      .build({
        outfile: 'dist/index.cjs.js',
        format: 'cjs',
        ...commonOptions,
      })
      .then(({ metafile }) => {
        console.log('cjs build successful');
        console.log('creating build dependency file');
        fs.writeFileSync('dist/meta.cjs.json', JSON.stringify(metafile, null, 2), 'utf-8');
      });

    esbuild
      .build({
        entryPoints: [source],
        outdir: 'dist/',
        format: 'esm',
        splitting: true,
        ...commonOptions,
      })
      .then(({ metafile }) => {
        console.log('esbuild successful');
        console.log('creating build dependency file');
        fs.writeFileSync('dist/meta.esbuild.json', JSON.stringify(metafile, null, 2), 'utf-8');
      });
  } catch (e) {
    console.log(`× ${pkg.name}: Build failed due to an error.`);
    console.log(e);
  }
}

main();
