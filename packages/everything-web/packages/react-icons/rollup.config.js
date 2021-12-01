import { getBabelOutputPlugin } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
// import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import summary from 'rollup-plugin-summary';
import { terser } from 'rollup-plugin-terser';
import visualizer from 'rollup-plugin-visualizer';

import pkg from './package.json';

const isProduction = process.env.NODE_ENV === 'production';
const debug = process.env.DEBUG === 'true';

const config = {
    input: 'src/index.tsx',
    output: [
        { file: pkg.main, format: 'cjs', sourcemap: true },
        { dir: 'dist', format: 'esm', preserveModules: true, sourcemap: true }
    ],
    plugins: [
        summary({ showBrotliSize: false }),
        commonjs(),
        getBabelOutputPlugin({
            presets: [
                [
                    '@babel/preset-env',
                    {
                        loose: true,
                        bugfixes: true,
                        modules: false,
                        targets: { esmodules: true }
                    }
                ]
            ]
        }),
        isProduction && terser(),
        typescript(),
        debug && visualizer()
    ]
};

export default config;
