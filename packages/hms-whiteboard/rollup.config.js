// @ts-check
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import esbuild from 'rollup-plugin-esbuild';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';
import commonjs from '@rollup/plugin-commonjs';
import css from 'rollup-plugin-import-css';

const isProduction = process.env.NODE_ENV === 'production';

const deps = Object.keys(pkg.dependencies || {});
const peerDeps = Object.keys(pkg.peerDependencies || {});

/**
 * @type {import('rollup').RollupOptions}
 */
const config = {
  input: 'src/index.ts',
  external: [...deps, ...peerDeps],
  output: [
    { file: pkg.main, format: 'cjs', sourcemap: true, inlineDynamicImports: true },
    { dir: 'dist', format: 'esm', preserveModules: true, preserveModulesRoot: 'src', sourcemap: true },
  ],
  plugins: [
    commonjs(),
    css({ inject: true }),
    esbuild({ format: 'esm', target: 'esnext' }),
    resolve({ preferBuiltins: false }),
    isProduction && terser(),
    typescript({ sourceMap: true }),
  ],
};

export default config;
