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

const config = {
  input: 'src/index.ts',
  external: id => {
    // Externalize all @tldraw/* packages to avoid bundling duplicates
    if (id.startsWith('@tldraw/')) return true;
    // Externalize direct deps and peer deps
    return [...deps, ...peerDeps].some(dep => id === dep || id.startsWith(dep + '/'));
  },
  output: [
    { file: pkg.main, format: 'cjs', sourcemap: true },
    { dir: 'dist', format: 'esm', preserveModules: true, preserveModulesRoot: 'src', sourcemap: true },
  ],
  plugins: [
    commonjs(),
    css({ output: 'index.css' }),
    esbuild({ format: 'esm' }),
    resolve(),
    isProduction && terser(),
    typescript({ sourceMap: true }),
  ],
};

export default config;
