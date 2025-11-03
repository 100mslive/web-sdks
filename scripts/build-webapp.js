const fs = require('fs');
const esbuild = require('esbuild');

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
  const loader = { '.js': 'jsx', '.svg': 'copy', '.png': 'copy' };
  const define = { 'process.env': JSON.stringify(process.env) };
  const target = 'es6';

  const plugins = [];
  try {
    const commonOptions = {
      entryPoints: [source],
      assetNames: '[name]',
      minify: false,
      bundle: true,
      target,
      external,
      treeShaking: true,
      sourcemap: true,
      metafile: true,
      loader,
      define,
      plugins,
    };

    const cjsBuild = esbuild
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

    const esmBuild = esbuild
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

    // Wait for both builds to complete
    await Promise.all([cjsBuild, esmBuild]);

    // Post-process CSS to inline whiteboard imports for roomkit-react
    if (pkg.name === '@100mslive/roomkit-react') {
      // Copy whiteboard CSS and inline tldraw CSS
      const whiteboardCssSource = '../hms-whiteboard/dist/index.css';
      const tldrawCssPath = '../hms-whiteboard/node_modules/@tldraw/tldraw/tldraw.css';
      const outputCssPath = './dist/index.css';

      if (fs.existsSync(whiteboardCssSource)) {
        let css = fs.readFileSync(whiteboardCssSource, 'utf8');

        // Find and replace @import statements for @tldraw
        const importRegex = /@import url\(['"]@tldraw\/tldraw\/tldraw\.css['"]\);?/g;

        if (css.match(importRegex) && fs.existsSync(tldrawCssPath)) {
          const tldrawCss = fs.readFileSync(tldrawCssPath, 'utf8');
          // Replace the @import with the actual CSS content
          css = css.replace(importRegex, tldrawCss);
          fs.writeFileSync(outputCssPath, css, 'utf8');
          console.log('✓ Created index.css with inlined tldraw CSS');
        } else {
          // Just copy the whiteboard CSS as-is
          fs.writeFileSync(outputCssPath, css, 'utf8');
          console.log('✓ Copied whiteboard CSS to index.css');
        }
      } else {
        console.warn('⚠ Warning: Could not find whiteboard CSS');
      }
    }
  } catch (e) {
    console.log(`× ${pkg.name}: Build failed due to an error.`);
    console.log(e);
  }
}

main();
