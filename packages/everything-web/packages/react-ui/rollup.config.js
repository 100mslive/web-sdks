import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import postcss from 'rollup-plugin-postcss';
import { terser } from 'rollup-plugin-terser';

const packageJson = require('./package.json');

export default {
    input: 'src/index.ts',
    output: [
        {
            file: packageJson.main,
            format: 'cjs',
            sourcemap: true
        },
        {
            file: packageJson.module,
            format: 'esm',
            sourcemap: true
        }
    ],
    plugins: [
        peerDepsExternal(), // avoids us from bundling the peerDependencies (react and react-dom in our case)
        resolve(), // includes the third-party external dependencies into our final bundle
        commonjs(), // enables the conversion to CJS
        typescript({ useTsconfigDeclarationDir: true }), // generates the type declarations
        postcss({
            extensions: ['.css'] // helps include the CSS that we created as separate files in our final bundle
        }),
        terser() // minify generated es bundle
    ]
};
