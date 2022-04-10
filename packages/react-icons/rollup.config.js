import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import esbuild from 'rollup-plugin-esbuild';

import pkg from './package.json';

const isProduction = process.env.NODE_ENV === 'production';

const deps = Object.keys(pkg.dependencies || {});
const peerDeps = Object.keys(pkg.peerDependencies || {});

const config = {
  input: 'src/index.tsx',
  external: [...deps, ...peerDeps],
  output: [
    { file: pkg.main, format: 'cjs' },
    { dir: 'dist', format: 'esm', preserveModules: true },
  ],
  plugins: [commonjs(), esbuild({ format: 'esm' }), resolve(), isProduction && terser()],
};

export default config;
