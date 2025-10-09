import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
import esbuild from 'rollup-plugin-esbuild';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

const isProduction = process.env.NODE_ENV === 'production';

const deps = Object.keys(pkg.dependencies || {});
const peerDeps = Object.keys(pkg.peerDependencies || {});

const config = {
  input: 'src/index.ts',
  external: [...deps, ...peerDeps, 'react/jsx-runtime'],
  output: [
    { file: pkg.main, format: 'cjs', sourcemap: true },
    { dir: 'dist', format: 'esm', preserveModules: true, preserveModulesRoot: 'src', sourcemap: true },
  ],
  plugins: [
    replace({ preventAssignment: true, 'process.env.REACT_SDK_VERSION': JSON.stringify(pkg.version) }),
    resolve(),
    esbuild({
      format: 'esm',
      jsx: 'automatic',
      jsxImportSource: 'react',
    }),
    commonjs({
      ignore: ['react/jsx-runtime'],
    }),
    isProduction && terser(),
    typescript({ sourceMap: true }),
  ],
};

export default config;
